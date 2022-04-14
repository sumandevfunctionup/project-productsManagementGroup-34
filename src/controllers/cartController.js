const cartModel = require('../models/cartModel')
const userModel = require("../models/userModel")
const productModel = require('../models/productModel')
const ObjectId = require('mongoose').Types.ObjectId

const addItems = async function(req,res){ // {id:productId}
    try{
        // validation of Objectid in params
        if(!ObjectId.isValid(req.params.userId)) return res.status(400).send({status:false,msg:'enter a valid objectId in params'})
        // check authorisation of the user
        if(req.userId != req.params.userId) return res.status(403).send({status:false,msg:'you are not authorized'})

        let user = await userModel.findById(req.userId);
        if(!user) return res.status(404).send({status:false,msg:'no user found'})

        let productId = req.body.productId;
        // validation of product // check if cart is present
        if(!ObjectId.isValid(productId)) return res.status(400).send({status:false,msg:'enter a valid productId in body'})
        let product = await productModel.findOne({_id:productId,isDeleted:false})
        if(!product) return res.status(404).send({status:false,msg:'no product found'})

        // Now fiding the cart

        let cart = await cartModel.findOne({userId : req.userId}).lean()

        if(cart){
            let index = cart.items.findIndex(el => el.productId == productId) // for loop  $
            if(index >-1) {
               cart.items[index].quantity +=1;
                cart.totalItems +=1;
                cart.totalPrice +=  product.price;
                let updatedCart = await cartModel.findOneAndUpdate({userId : req.userId},{items:cart.items,totalItems:cart.totalItems,totalPrice:cart.totalPrice},{new:true})
                return res.send(updatedCart)
            }
            let products = {productId:productId,quantity:1}
            let updatedCart = await cartModel.findOneAndUpdate({userId : req.userId},{$addToSet: {items :products},$inc:{totalItems:1,totalPrice:product.price}},{new:true})
            return res.send(updatedCart)

        }

        let cartDetails = {
            userId : req.userId,
            items :  [{productId:productId,quantity:1}],
            totalItems:1,
            totalPrice:product.price
        }
        let newCart = await cartModel.create(cartDetails)

        return res.status(201).send({status:true,msg:'cart created successfully', data : newCart})
        
    }
    catch(error){
        return res.status(500).send({status:false,msg:error.message})
    }
}
module.exports.addItems = addItems