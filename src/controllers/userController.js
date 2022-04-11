const userModel = require("../models/userModel");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const saltRound = 10;
const { validate } = require("../models/userModel");

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
  }

const userRegister = async function(req, res){
       try{
           if(Object.keys(req.body).length == 0){
               return res.status(400).send({status: false, msg: "Enter valid data"})
           }
           let data = req.body
           let {fname, lname, email, profileImage, phone, password, address} = data

           if(!isValid(fname)) return res.status(400).send({status: false, msg: "first Name is required"})
           if(!isValid(lname)) return res.status(400).send({status: false, msg: "last Name is required"})
         
        //    if(!(/^([a-zA-Z0-9\.-]+)@([a-zA-Z0-9-]+).([a-z]+)$/.test(data.email.trim())))
        //        return res.status(400).send({status: false, msg:"Please enter valid email"})

        if(!(/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/.test(email)))
         return res.status(400).send({status:false,msg:"email ID is not valid"})
         let dupEmail = await userModel.findOne({email: email})
         if(dupEmail) return res.status(400).send({status:false, msg: "email is already registered"})

           if(!(/^[6-9]\d{9}$/.test(phone))) {
                return res.status(400).send({ status: false, message: "phone number should be valid number" })
            }
            let dupPhone = await userModel.findOne({phone: phone})
            if(dupPhone) return res.status(400).send({status:false, msg: "phone is already registered"})
   
           if (!(/^(\d{4}|\d{6})$/.test(address.shipping.pincode))) {
                return res.status(400).send({ status: false, message: "Please enter valid Pincode for shipping" })
            }
            if (!(/^(\d{4}|\d{6})$/.test(address.billing.pincode))) {
                return res.status(400).send({ status: false, message: "Please enter valid Pincode for billing" })
            }
          
            if(!password) return res.status(400).send({status: false, msg: "Password is required"})
            if(password.length<8 || password.length>15) 
            return res.status(400).send({status: false, msg: "Password length should be 8 to 15"})
            
            data.password  = await bcrypt.hash(password, saltRound);


           const createUser = await userModel.create(data)
           return res.status(201).send({status: true, msg: "Created succesfully", data: createUser})

       }
       catch(error)
       {
           console.log("error",error.message)
           res.status(500).send({status:false,msg:error.message})
       
       }      
}

const login = async function(req, res){
    try{
        let data = req.body
        let {email, password} = data

       if(!email || !password)
       return res.status(400).send({status: false, msg:`Email and Password is mandatory field.`})
        if(!isValid(email)) return res.status(400).send({status: false, msg: "enter the valid email"})
        if(!(/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/.test(email)))
             return res.status(400).send({status:false,msg:"email ID is not valid"})
            
        if(!isValid(password)) return res.status(400).send({status: false, msg: "Enter the valid Password"})
        if(password.length<8 || password.length>15) 
           return res.status(400).send({status: false, msg: "Password length should be 8 to 15"})

         let user = await userModel.findOne({email:email})
         if(!user) return res.status(400).send({status: false, msg: "emailId or password is not correct"})

         let rightPwd = bcrypt.compareSync(password, user.password);        
         console.log(rightPwd)
        if(!rightPwd) return res.status(400).send({status:false,msg:"password is incorrect"})
         let token = jwt.sign({ exp: Math.floor(Date.now() / 1000) + (24*60*60),
         userId: user._id.toString()
         },
         "group-34-productManagement"
)
    return res.status(200).send({status: true, msg: "login succesfully", data: {userId:user.id, token : token}})
    }
    catch(error){
        return res.status(500).send({status: false, msg: error.message})
    }
}

module.exports.userRegister = userRegister
module.exports.login =  login
