const productModel = require('../models/productModel')
const upload = require("../upload/upload");
const ObjectId = require('mongoose').Types.ObjectId
const currency = require('currency-symbol-map');

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
}

const create = async function (req,res){
try{
    if(Object.keys(req.body).length == 0) return res.status(400).send({status:false,msg:'Enter the details for product'})
    
    let data = req.body;
    let {title,description, price, currencyId,currencyFormat,isFreeShipping,style,availableSizes,installments} = data;

    // title validation
    if(!title) return res.status(400).send({status:false,msg:'enter the title for product'})

    if(!isValid(title)) return res.status(400).send({status:false,msg:'title is not valid'})

    let dupTitle = await productModel.findOne({title:title})
    if(dupTitle) return res.status(400).send({status:false,msg:'title is already is present'})

    // description validation
    if(!description) return res.status(400).send({status:false,msg:'enter the description'})
    if(!isValid(description)) return res.status(400).send({status:false,msg:'description is not valid'})

    // currency Id validation
    if(!currencyId) {
        data.currencyId = "INR"
        currencyId = "INR"
    }
    if(!isValid(currencyId)) return res.status(400).send({Status:false,msg:"currency Id is not valid"})

    if(currencyFormat) return res.status(400).send({status:false, msg:'just add the currency Id'})
    const symbol = currency(currencyId) // trim is required or not 
    if(!symbol) return res.status(400).send({status:false,msg:'currency ID is not valid'})
    data.currencyFormat = symbol;

    //price validation
    if(!price) return res.status(400).send({status:false,msg:'enter the price'})
    if(!Number(price)) return res.status(400).send({status:false,msg:'price is not valid'})
    if(Number(price) <= 0) return res.status(400).send({status:false,msg:'price is not valid'})
    data.price = Number(price);

    // avaiable Sizes => array of strings
    if(availableSizes.length == 0) return res.status(400).send({status:false,msg: 'available size cannot be empty'})
    if(typeof(availableSizes) == 'string') data.availableSizes = JSON.parse(availableSizes)
    for(let size of data.availableSizes){ // size => arr[i]
        if(!["XS", "X", "S", "M", "L", "XL", "XXL"].includes(size)) return res.status(400).send({status:false,msg:'wrong size parameter is given'})
    }


    if(isFreeShipping){
        let bool = isFreeShipping === 'true'
        if(bool != true && bool != false ) return res.status(400).send({status:false,msg:'invalid parameter in isFreeShipping'})
    }

    if(style){
        if(!isValid(style)) return res.status(400).send({status:false,msg:'style is not valid'})
    }

    if(installments){
        if(Number(installments)) return res.status(400).send({status:false,msg:'installments are not valid'})
        if(Number(installments) <= 0) return res.status(400).send({status:false,msg:'intallment is not valid'})
        data.installments = Number(installments)
    }

    let files = req.files;

    if (!files || files.length == 0) return res.status(400).send({status:false,msg:'please add the file'})
  
      //upload to s3 and get the uploaded link
      var uploadedFileURL = await upload.uploadFile(files[0]); // used var to declare uploadedFileURl in global scope
      
    //   adding the file link and encrypted password in the user Model
    //   send error if profileImage is present
      data.productImage = uploadedFileURL

    let product = await productModel.create(data);
    return res.status(201).send({status:true,msg:'product created succesfully', data : product})
    
}
catch(error){
    return res.status(500).send({status:false,msg:error.message})
}
}

const getProducts = async function(req,res){
    try{
        let filterCondn = {isDeleted:false};
        let query = req.query;
        let {name,size,priceGreaterThan, priceLessThan, priceSort} = query;
        if(Object.keys(req.query).length >0){ 
            if(name){
                if(!isValid(name)) return res.status(400).send({status:false,msg:'enter the valid name in filter condition'})
                const regexName = new RegExp(name,"i")
                filterCondn.title = {$regex : regexName}
            }
            if(size){
                size = JSON.parse(size);
                for (let i = 0; i < size.length; i++) {
                    if (!(["XS", "X", "S", "M", "L", "XL", "XXL"].includes(size[i]))) {
                        return res.status(400).send({ status: false, message: `invalid size parameter, Sizes must be among ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
                    }
                }
                filterCondn.availableSizes = {$in : size}

            }

            if(priceGreaterThan && priceLessThan){
                if(!(Number(priceGreaterThan) && Number(priceLessThan))) return res.status(400).send({status:false,msg:'price greater than or price less than is not valid'}) 
                if(Number(priceGreaterThan) > Number(priceLessThan)) return res.status(400).send({status:false,msg:'price conditions are not valid'})
                filterCondn.price = {$gte:priceGreaterThan, $lte:priceLessThan}
            }else if(priceGreaterThan){
                if(!Number(priceGreaterThan)) return res.status(400).send({status:false,msg:'price greater than is not valid'})
                filterCondn.price = {$gte:priceGreaterThan};

            }else if(priceLessThan){
                if(!Number(priceLessThan)) return res.status(400).send({status:false,msg:'price greater than is not valid'})
                filterCondn.price = {$lte:priceLessThan};
            }

            if(priceSort){
                if(![-1,1].includes(Number(priceSort))) return res.status(400).send({status:false,msg:'price sort is not valid'})
                let products = await productModel.find(filterCondn).sort({price:priceSort})
                if(!products) return res.status(404).send({status:false,msg:'No product found'})
                return res.status(200).send({status:true,msg:"Product list", data : products});
            }
            
        }
        let products = await productModel.find(filterCondn);
        if(products.length == 0) return res.status(404).send({status:false,msg:'No product found'})
        return res.status(200).send({status:true,msg:'products found successfully', data:products})
    }
    catch(error){
        return res.status(500).send({status:false,msg:error.message})
    }
}

const getProductById = async function (req,res){
    try{
        let productId = req.params.productId;
        if(!ObjectId.isValid(productId)) return res.status(400).send({status:false,msg:'product Id is not valid'})
        let product = await productModel.findOne({_id:productId, isDeleted : false})
        if(!product) return res.status(404).send({status:false,msg:'no product found'})

        return res.status(200).send({status:true,msg:"product found successfully", data : product})
    }
    catch(error){
        return res.status(500).send({status:false,msg:error.message})
    }
}
const deleteProductById = async function (req,res){
    try{
        let productId = req.params.productId;
        if(!ObjectId.isValid(productId)) return res.status(400).send({status:false,msg:'product Id is not valid'})
        let product = await productModel.findOne({_id:productId, isDeleted : false})
        if(!product) return res.status(404).send({status:false,msg:'no product found'})
        await productModel.findOneAndUpdate({_id:productId, isDeleted : false}, {isDeleted:true, deletedAt : new Date})
        return res.status(200).send({status:true, msg:"deleted success"})

    }
    catch(error){return res.status(500).send({status:false,msg:error.message})}
}

const updateProductById = async function(req,res){
    try{
        let productId = req.params.productId;
        if(!ObjectId.isValid(productId)) return res.status(400).send({status:false,msg:'product Id is not valid'})
        let product = await productModel.findOne({_id:productId, isDeleted : false})
        if(!product) return res.status(404).send({status:false,msg:'no product found'})
        
        if(Object.keys(req.body).length == 0) return res.status(400).send({status:false,msg:'Enter the details for update'})

        let data = req.body;
        let {title,description, price, currencyId,currencyFormat,isFreeShipping,style,availableSizes,installments} = data;
        // Currency format, available sizes
        // title validation
        if(title){
            if(!isValid(title))  return res.status(400).send({status:false,msg:'enter the valid title for product'})
            let dupTitle = await productModel.findOne({title:title})
            if(dupTitle) return res.status(400).send({status:false,msg:'title is already is present'})  
        }

        // description validation
        if(description) {
            if(!isValid(description)) return res.status(400).send({status:false,msg:'description is not valid'})
        }

        ///price validation
        if(currencyId) {
            if(!isValid(currencyId)) return res.status(400).send({Status:false,msg:"currency Id is not valid"})
            const symbol = currency(currencyId)
            if(!symbol) return res.status(400).send({status:false,msg:'currency ID is not valid'})
            data.currencyFormat = symbol;
        }
        
    
        if(price) {
            if(!Number(price)) return res.status(400).send({status:false,msg:'price is not valid'})
            if(Number(price)<=0) return res.status(400).send({status:false,msg:'price cannot be zero or negative'})
        }
        if(installments) {
            if(!Number(installments)) return res.status(400).send({status:false,msg:'installment is not valid'})
            if(Number(installments)<=0) return res.status(400).send({status:false,msg:'installment cannot be zero or negative'})
        }
        if(isFreeShipping){
            let bool = isFreeShipping === 'true'
            if(bool != true && bool != false ) return res.status(400).send({status:false,msg:'invalid parameter in isFreeShipping'})
        }
        if(style) {
            if(!isValid(style)) return res.status(400).send({status:false,msg:'description is not valid'})
        }

        if(availableSizes){
            data.availableSizes =JSON.parse(availableSizes);
            availableSizes =JSON.parse(availableSizes);
            for (let i = 0; i < availableSizes.length; i++) {
                if (!(["XS", "X", "S", "M", "L", "XL", "XXL"].includes(availableSizes[i]))) {
                    return res.status(400).send({ status: false, message: `invalid size parameter, Sizes must be among ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
                }
            }
            

        }
        // if product image is present
        if(req.files && req.files.length >0){

        //upload to s3 and get the uploaded link
        var uploadedFileURL = await upload.uploadFile(files[0]); // used var to declare uploadedFileURl in global scope
      
        // adding the file link and encrypted password in the user Model
        // send error if profileImage is present
        data.productImage = uploadedFileURL
    }
        let updatedProduct = await productModel.findOneAndUpdate({_id:productId, isDeleted:false}, {$set:data},{new:true})
        return res.status(200).send({status:true,msg:'successfully updated', data : updatedProduct})

    }
    catch(error){
        return res.status(500).send({status:false,msg:error.message})
    }
}
module.exports.create = create;
module.exports.getProducts = getProducts;
module.exports.getProductById = getProductById;
module.exports.updateProductById = updateProductById;
module.exports.deleteProductById = deleteProductById;
