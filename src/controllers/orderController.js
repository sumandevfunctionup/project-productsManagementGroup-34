const orderModel = require('../models/orderModel')
const cartModel = require('../models/cartModel')
const userModel = require("../models/userModel")
const ObjectId = require('mongoose').Types.ObjectId

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
}

const createOrder = async function(req,res){ // input cancelable and status
    try{
        // validation of Objectid in params
        if(!ObjectId.isValid(req.params.userId)) return res.status(400).send({status:false,msg:'enter a valid objectId in params'})
        // check authorisation of the user
        if(req.userId != req.params.userId) return res.status(403).send({status:false,msg:'you are not authorized'})

        let user = await userModel.findById(req.userId);
        // !  status code doubt
        if(!user) return res.status(404).send({status:false,msg:'no user found'}) 

        // cart validation and at least one product present
        let cart = await cartModel.findOne({userId:req.userId})
        if(!cart) return res.status(400).send({status:false,msg:'cart is not present for the specific user'})

        // no product added in the cart 
        if(cart.items.length == 0) return res.status(400).send({status:false,msg:'cart of this user is empty, add products first'})

        //check body is empty or not
        if(Object.keys(req.body).length == 0 ) return res.status(400).send({status:false,msg:"enter the order details"})

        let {cancellable, status} = req.body;
        // include array function => return boolean 
        // similar to hasOwnPropety(<key>) return boolean
        if(![true,false].includes(cancellable)) return res.status(400).send({status:false,msg:'enter cancelable in correct format'})

        if(!['pending','completed', 'cancelled'].includes(status)) return res.status(400).send({status:false,msg:"status should be from [pending,completed,canceled]"})

        let totalQuantity = 0;
        // can use forEach, for loop also
        cart.items.map(product => totalQuantity += product.quantity)

        let data = {
            userId : req.userId,
            items: cart.items,
            totalPrice : cart.totalPrice,
            totalItems : cart.totalItems,
            totalQuantity : totalQuantity,
            cancellable, status
        }

        let order = await orderModel.create(data)
        return res.status(201).send({status:true,msg:"order created successfully", data : order})

    }catch(error){
        return res.status(500).send({status:false,msg:error.message})
    }
}

const updateOrder = async function(req,res){
    try{
        // validation of Objectid in params
        if(!ObjectId.isValid(req.params.userId)) return res.status(400).send({status:false,msg:'enter a valid objectId in params'})
        // check authorisation of the user
        if(req.userId != req.params.userId) return res.status(403).send({status:false,msg:'you are not authorized'})

        let user = await userModel.findById(req.userId);
        // !  status code doubt
        if(!user) return res.status(404).send({status:false,msg:'no user found'}) 

        //check body is empty or not
        if(Object.keys(req.body).length == 0 ) return res.status(400).send({status:false,msg:"enter the order details"})

        let {orderId, status} = req.body;
        // include array function => return boolean 
        // similar to hasOwnPropety(<key>) return boolean
       if(!ObjectId.isValid(orderId)) return res.status(400).send({status:false,msg:'orderId is not valid'})

       let order = await  orderModel.findOne({userId : req.userId})
       if(!order) return res.status(400).send({status:false,msg:'no order present'})

       if(order.userId != req.userId) return res.status(403).send({status:false,msg:'You are not authorized'})

        if(!['pending','completed', 'cancelled'].includes(status)) return res.status(400).send({status:false,msg:"status should be from [pending,completed,canceled]"})

        if(order.cancellable == false && status == 'cancelled') return res.status(400).send({status:false,msg:'Order cannot be cancelled'})

        let updatedOrder = await orderModel.findByIdAndUpdate(orderId, {status : status}, {new:true}) 
        return res.status(200).send({status:true,msg:'success', data :  updatedOrder})

    }catch(error){
        return res.status(500).send({status:false,msg:error.message})
    }
}

module.exports.createOrder = createOrder;
module.exports.updateOrder = updateOrder;