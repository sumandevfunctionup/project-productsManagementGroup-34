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
    // validation of product 
        let productId = req.body.productId;
      
        if(!ObjectId.isValid(productId)) return res.status(400).send({status:false,msg:'enter a valid productId in body'})
        let product = await productModel.findOne({_id:productId,isDeleted:false}) // product Object
        if(!product) return res.status(404).send({status:false,msg:'no product found'})

        // check if cart is present
        // Now fiding the cart

        let cart = await cartModel.findOne({userId : req.userId}).lean()

        if(cart){ // if cart is already there
            let index = cart.items.findIndex(el => el.productId == productId) // -1 or index
            if(index >-1) { // if the product is already in the cart
               cart.items[index].quantity +=1; //increase the quantity of product by 1
                let updatedCart = await cartModel.findOneAndUpdate({userId : req.userId},{items:cart.items,$inc:{totalItems:1,totalPrice:product.price}},{new:true})
                return res.status(200).send({status:true,msg:'product quantity is increased by 1', data : updatedCart})
            }
            //if product  is not present in the cart.items
            // $addToSet => add a element in the array
            let products = {productId:productId,quantity:1}
            let updatedCart = await cartModel.findOneAndUpdate({userId : req.userId},{$addToSet: {items :products},$inc:{totalItems:1,totalPrice:product.price}},{new:true})
            return res.send(updatedCart)

        }
        // if cart is not created yet
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

const removeItems = async function(req,res){
    try{
        // validation of Objectid in params
        if(!ObjectId.isValid(req.params.userId)) return res.status(400).send({status:false,msg:'enter a valid objectId in params'})
        // check authorisation of the user
        if(req.userId != req.params.userId) return res.status(403).send({status:false,msg:'you are not authorized'})

        let user = await userModel.findById(req.userId);
        if(!user) return res.status(404).send({status:false,msg:'no user found'})

        let {productId, removeProduct} = req.body;
        // validation of product // check if cart is present
        if(!ObjectId.isValid(productId)) return res.status(400).send({status:false,msg:'enter a valid productId in body'})
        let product = await productModel.findOne({_id:productId,isDeleted:false})
        if(!product) return res.status(404).send({status:false,msg:'no product found'})

        // Now fiding the cart
        // $elemMatch => run for every element of array similar to for loop

        let cart = await cartModel.findOne({userID : req.userId}) 
        if(!cart) return res.status(400).send({status:false,msg:'cart is not present for this user'})

        let cartWithProduct = await cartModel.findOne({userId : req.userId, items:{$elemMatch : {productId : productId}}}).lean()
        if(!cartWithProduct) return res.status(404).send({status:false,msg:'not able to find the product in the cart'})

        if(removeProduct != 1 && removeProduct !=0) return res.status(400).send({status:false,msg:'removeProduct should be 1 or 0 only'})
        let index = cart.items.findIndex(el => el.productId == productId);
        let quantity = cart.items[index].quantity;
        if(removeProduct == 0){ // remove the comlpete object (removeProduct == 0)
            cart.totalItems -= quantity;
            cart.totalPrice -= quantity * product.price
            let updatedCart = await cartModel.findOneAndUpdate({userId : req.userId, items:{$elemMatch : {productId : productId}}},{$pull : {items:{productId:productId}},$set:{totalItems : cart.totalItems, totalPrice : cart.totalPrice}}, {new:true})
            return res.status(200).send({status:true,msg:'deleted Successfully', data:updatedCart})
        }
        if(quantity == 1){ // if only 1 quantity of product is present so remove the object
            let updatedCart = await cartModel.findOneAndUpdate({userId : req.userId, items:{$elemMatch : {productId : productId}}},{$pull : {items:{productId:productId}},$inc:{totalItems : -1, totalPrice : -product.price}}, {new:true})
            return res.status(200).send({status:true,msg:'deleted Successfully', data:updatedCart})
        }

        // if product's quantity is more than 1

        cart.items[index].quantity -=1;
        let updatedCart = await cartModel.findOneAndUpdate({userId : req.userId, items:{$elemMatch : {productId : productId}}},{items : cart.items,$inc:{totalItems : -1, totalPrice : -product.price}}, {new:true})
            return res.status(200).send({status:true,msg:'deleted Successfully', data:updatedCart})

    }
    catch(error){
        return res.status(500).send({status:false,msg:error.message})
    }
}


const getCart = async function(req,res){
    try{
        // validation of Objectid in params
        if(!ObjectId.isValid(req.params.userId)) return res.status(400).send({status:false,msg:'enter a valid objectId in params'})
        // check authorisation of the user
        if(req.userId != req.params.userId) return res.status(403).send({status:false,msg:'you are not authorized'})

        let user = await userModel.findById(req.userId);
        if(!user) return res.status(404).send({status:false,msg:'no user found'})

        // Now fiding the cart
        // $elemMatch => run for every element of array similar to for loop

        let cart = await cartModel.findOne({userID : req.userId}).populate('items.productId') 
        // get the product document from product collection using populate
        if(!cart) return res.status(400).send({status:false,msg:'cart is not present for this user'})
        return res.status(200).send({status:true,msg:'card details', data : cart})


    }
    catch(error){
        return res.status(500).send({status:false,msg : error.message})
    }
}

const deleteCart = async function(req,res){
    try{
// validation of Objectid in params
        if(!ObjectId.isValid(req.params.userId)) return res.status(400).send({status:false,msg:'enter a valid objectId in params'})
        // check authorisation of the user
        if(req.userId != req.params.userId) return res.status(403).send({status:false,msg:'you are not authorized'})

        let user = await userModel.findById(req.userId);
        if(!user) return res.status(404).send({status:false,msg:'no user found'})

        // Now fiding the cart
        // $elemMatch => run for every element of array similar to for loop

        let cart = await cartModel.findOne({userID : req.userId})
        if(!cart) return res.status(400).send({status:false,msg:'cart is not present for this user'})
        
        await cartModel.findOneAndUpdate({userID : req.userId}, {items:[],totalItems:0, totalPrice : 0},{new:true})

        return res.status(204)
    }
    catch(error){
        return res.status(500).send({status:false, msg:error.message})
    }
}

module.exports.addItems = addItems
module.exports.removeItems = removeItems
module.exports.getCart = getCart;
module.exports.deleteCart = deleteCart;