const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRound = 10; // level of difficulty
const upload = require("../upload/upload");
const { json } = require("express/lib/response");
const ObjectId = require('mongoose').Types.ObjectId

const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};

const userRegister = async function (req, res) {
  try {
    
    //checking body is empty or not
    if (Object.keys(req.body).length == 0) {
      return res.status(400).send({ status: false, msg: "Enter valid data" });
    }

    let data = req.body;
    let { fname, lname, email, profileImage, phone, password, address } = data;

    // validation of fname
    if (!isValid(fname))
      return res.status(400).send({ status: false, msg: "first Name is required" });

    // validation of lname
    if (!isValid(lname))
      return res.status(400).send({ status: false, msg: "last Name is required" });

    // valiation of email
    email = email.trim()
    if (!/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/.test(email))
      return res.status(400).send({ status: false, msg: "email ID is not valid" });

    let dupEmail = await userModel.findOne({ email: email });
    if (dupEmail) return res.status(400).send({ status: false, msg: "email is already registered" });

    if (!/^[6-9]\d{9}$/.test(phone)) return res.status(400).send({status: false,message: "phone number should be valid number",});

    let dupPhone = await userModel.findOne({ phone: phone });
    if (dupPhone) return res.status(400).send({ status: false, msg: "phone is already registered" });

    //validation of address
    if(!address) return res.status(400).send({status:false,msg:'enter the address'})
    //validation of shipping address add isvalid function
    if(!address.shipping) return res.status(400).send({status:false,msg:'enter the shipping address'})
    if(!isValid(address.shipping.city)) return res.status(400).send({status:false,msg:'enter the shipping address city'})
    if(!isValid(address.shipping.street)) return res.status(400).send({status:false,msg:'enter the shipping address street'})
    if(!address.shipping.pincode) return res.status(400).send({status:false,msg:'enter the shipping address pincode'})
    if (!/^(\d{4}|\d{6})$/.test(address.shipping.pincode)) return res.status(400).send({status: false,message: "Please enter valid Pincode for shipping",});

    //validation of billing address
    if(!address.billing) return res.status(400).send({status:false,msg:'enter the billing address'})
    if(!isValid(address.billing.city)) return res.status(400).send({status:false,msg:'enter the billing address city'})
    if(!isValid(address.billing.street)) return res.status(400).send({status:false,msg:'enter the billing address street'})
    if(!address.billing.pincode) return res.status(400).send({status:false,msg:'enter the billing address pincode'})
    if (!/^(\d{4}|\d{6})$/.test(address.billing.pincode)) return res.status(400).send({status: false,message: "Please enter valid Pincode for billing"});

    if (!password) return res.status(400).send({ status: false, msg: "Password is required" });
    if (password.length < 8 || password.length > 15) return res.status(400).send({ status: false, msg: "Password length should be 8 to 15" });

  // uploading file and getting aws s3 link
  let files = req.files;
  if (!files || files.length == 0) return res.status(400).send({status:false,msg:'please add the file'})

    //upload to s3 and get the uploaded link
    var uploadedFileURL = await upload.uploadFile(files[0]); // used var to declare uploadedFileURl in global scope
    
    // adding the file link and encrypted password in the user Model
    // send error if profileImage is present
    data.profileImage = uploadedFileURL
    data.password = await bcrypt.hash(password, saltRound); // method of becrypt
    // hashing documentation

    const createUser = await userModel.create(data)
    return res.status(201).send({ status: true, msg: "Created succesfully", data: createUser });
  } catch (error) {
    console.log("error", error.message);
    res.status(500).send({ status: false, msg: error.message });
  }
};

const login = async function (req, res) {
  try {
    let data = req.body;
    let { email, password } = data;

    if (!email || !password) return res.status(400).send({ status: false, msg: `Email and Password is mandatory field.` });

    if (!isValid(email)) return res.status(400).send({ status: false, msg: "enter the valid email" });

    if (!/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/.test(email)) return res.status(400).send({ status: false, msg: "email ID is not valid" });

    if (!isValid(password)) return res.status(400).send({ status: false, msg: "Enter the valid Password" });

    if (password.length < 8 || password.length > 15) return res.status(400).send({ status: false, msg: "Password length should be 8 to 15" });

    let user = await userModel.findOne({ email: email });
    if (!user)return res.status(400).send({ status: false, msg: "emailId is not correct" });

    let rightPwd = bcrypt.compareSync(password, user.password);
    console.log(rightPwd);
    if (!rightPwd) return res.status(400).send({ status: false, msg: "password is incorrect" });

    let token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours expiration time
        userId: user._id.toString(),
      },
      "group-34-productManagement"
    );
    return res.status(200).send({status: true,msg: "login succesfully",data: { userId: user._id, token: token }});
  } catch (error) {
    return res.status(500).send({ status: false, msg: error.message });
  }
};

const getUser = async function(req,res){
    try{
        // validation of Objectid in params
        if(!ObjectId.isValid(req.params.userId)) return res.status(400).send({status:false,msg:'enter a valid objectId in params'})

        // check authorisation of the user
        if(req.headers.userId != req.params.userId) return res.status(403).send({status:false,msg:'you are not authorized'})

        let user = await userModel.findById(req.headers.userId)
        if(!user) return res.status(404).send({status:false,msg:'No user Found'})
        return res.status(200).send({status:true,msg:'User Profile details', data : user})

    }
    catch(error){
        return res.status(500).send({status:false,msg:error.message})
    }

}

const updateUser = async function (req,res){
    try{
    // validation of Objectid in params
    if(!ObjectId.isValid(req.params.userId)) return res.status(400).send({status:false,msg:'enter a valid objectId in params'})
        console.log(req.params.userId)
    // check authorisation of the user
    if(req.userId != req.params.userId) return res.status(403).send({status:false,msg:'you are not authorized'})

    //checking body is empty or not
    if (Object.keys(req.body).length == 0) {
        return res.status(400).send({ status: false, msg: "Enter valid data to update" });
      }
      let obj = {}
      var data = req.body;
      var { fname, lname, email, profileImage, phone, password, address } = data;
    //   if(data.hasOwnProperty("fname")){ // check key name is present or not return boolean
    //     if(!isValid(fname)) return res.status(400).send({ status: false, msg: "first Name is not valid" });
    //     obj.fname = data.fname
    //   }
      // validation of fname 
      // 

    if (fname){
        if(!isValid(fname)) return res.status(400).send({ status: false, msg: "first Name is not valid" });
    }
      
    // validation of lname
    if (lname){
        if(!isValid(lname)) return res.status(400).send({ status: false, msg: "last Name is not valid" });
    }
  
    // valiation of email
    if(email){
        if(!isValid(email)) return res.status(400).send({ status: false, msg: "email Id is not valid" });

        email = email.trim()
        if (!/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/.test(email))
            return res.status(400).send({ status: false, msg: "email ID is not valid" });
  
        let dupEmail = await userModel.findOne({ email: email });
        if (dupEmail) return res.status(400).send({ status: false, msg: "email is already registered" });
  
    }

    if(phone){

        if (!/^[6-9]\d{9}$/.test(phone)) return res.status(400).send({status: false,message: "phone number should be valid number",});
    
        let dupPhone = await userModel.findOne({ phone: phone });
        if (dupPhone) return res.status(400).send({ status: false, msg: "phone is already registered" });
    }

    if(password){
        console.log('p')
        let user = await userModel.findById(req.userId);
        // check if passsword is same as previous one 
        let same = bcrypt.compareSync(password, user.password);
        console.log(rightPwd);
        if (same) return res.status(400).send({ status: false, msg: "password is same as the lastone, try another one or login" });
        data.password = await bcrypt.hash(password, saltRound);
    }
    
    // if(data.hasOwnProperty("fname")){ // check key name is present or not return boolean
    //         if(!isValid(fname)) return res.status(400).send({ status: false, msg: "first Name is not valid" });
    //         obj.fname = data.fname
    //       }
    //       json.parse()


    if(address){
        if(address.shipping){
            if(address.shipping.city){
                if(!isValid(address.shipping.city)) return res.status(400).send({ status:false,msg:'shipping address city is not valid'})
                var shippingCity = address.shipping.city;
            }
            if(address.shipping.street){
                if(!isValid(address.shipping.street)) return res.status(400).send({ status:false,msg:'shipping address street is not valid'})
                var shippingStreet = address.shipping.street;
            }
            if(address.shipping.pincode){
                if (!/^(\d{4}|\d{6})$/.test(address.shipping.pincode)) return res.status(400).send({status: false,message: "Please enter valid Pincode for shipping",});
                var shippingPincode = address.shipping.pincode;
            }
            
        }
        if(address.billing){
            if(address.billing.city){
                if(!isValid(address.billing.city)) return res.status(400).send({ status:false,msg:'billing address city is not valid'})
                var billingCity = address.billing.city; // falana
            }
            if(address.billing.street){
                if(!isValid(address.billing.street)) return res.status(400).send({ status:false,msg:'billing address street is not valid'})
                var billingStreet = address.billing.street;
            }
            if(address.billing.pincode){
                if (!/^(\d{4}|\d{6})$/.test(address.billing.pincode)) return res.status(400).send({status: false,message: "Please enter valid Pincode for billing",});
                var billingPincode = address.billing.pincode;
            }
        }

    }else{
        var asd = address
        console.log(address)
        console.log(address.shipping)
        console.log(address.shipping.city)
        console.log('1')
    }
    if(req.files && req.files.length>0){
        // uploading file and getting aws s3 link
        let files = req.files;
    //upload to s3 and get the uploaded link
    var uploadedFileURL = await upload.uploadFile(files[0]); // used var to declare uploadedFileURl in global scope

    }

     // method of becrypt
    

    let updatedUser = await userModel.findOneAndUpdate({_id:req.userId}, {$set:{fname:fname,lname:lname,email:email,phone:phone,password:password,profileImage : uploadedFileURL,"address.shipping.city" : shippingCity, "address.shipping.street":shippingStreet,"address.shipping.pincode" : shippingPincode,"address.billing.city" : billingCity, "address.billing.street":billingStreet,"address.billing.pincode" : billingPincode}}, {new:true})
    console.log(updatedUser)
    return res.status(200).send({status:true,msg:'successfully updated', data:updatedUser})

    }
    catch(error){
        return res.status(500).send({status:false,msg:error.message})
    }
}

module.exports.userRegister = userRegister;
module.exports.login = login;
module.exports.getUser = getUser;
module.exports.updateUser = updateUser;
