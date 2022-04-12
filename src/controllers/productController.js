const productModel = require('../models/productModel')
const moneySymbol = require('currency-symbol')
const upload = require("../upload/upload");
const ObjectId = require('mongoose').Types.ObjectId

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
}
//, enum : 

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

    ///price validation
    if(!currencyId) return res.status(400).send({status:false,msg:'enter the currecy Id'})
    if(!isValid(currencyId)) return res.status(400).send({Status:false,msg:"currency Id is not valid"})

    if(!price) return res.status(400).send({status:false,msg:'enter the price'})
    if(!Number(price)) return res.status(400).send({status:false,msg:'price is not valid'})

    let size = ["S", "XS","M","X", "L","XXL", "XL"]
    availableSizes = availableSizes.split(' ')
    console.log(availableSizes + typeof(availableSizes))
    for(let i=0;i<availableSizes.length;i++){
        if(!size.includes(availableSizes[i])) return res.status(400).send({status:false,msg:'wrong size parameters'})
    }
    data.availableSizes = availableSizes;
    console.log(typeof(isFreeShipping))
    if(installments){
        if(Number(installments)) return res.status(400).send({status:false,msg:'installments are not valid'})
    }
    
    let product = await productModel.create(data);
    return res.status(201).send({status:true,msg:'product created succesfully', data : product})
    
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
        let delProduct = await productModel.findOneAndUpdate({_id:productId, isDeleted : false}, {isDeleted:true, deletedAt : new Date})
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
        }
        
    
        if(price) {
            if(!Number(price)) return res.status(400).send({status:false,msg:'price is not valid'})
        }
        if(installments) {
            if(!Number(installments)) return res.status(400).send({status:false,msg:'price is not valid'})
        }
        if(isFreeShipping){
            let bool = isFreeShipping === 'true'
            console.log(bool)
            if(bool != true && bool != false ) return res.status(400).send({status:false,msg:'invalid parameter in isFreeShipping'})
        }
        if(style) {
            if(!isValid(style)) return res.status(400).send({status:false,msg:'description is not valid'})
        }
        
        let updatedProduct = await productModel.findOneAndUpdate({_id:productId, isDeleted:false}, {$set:data},{new:true})
        return res.status(200).send({status:true,msg:'successfully updated', data : updatedProduct})

    }
    catch(error){
        return res.status(500).send({status:false,msg:error.message})
    }
}
module.exports.create = create;
module.exports.getProductById = getProductById;
module.exports.updateProductById = updateProductById;
module.exports.deleteProductById = deleteProductById;
