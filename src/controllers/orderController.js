const orderModel = require('../models/orderModel')
const cartModel = require('../models/cartModel')
const userModel = require("../models/userModel")
const ObjectId = require('mongoose').Types.ObjectId

const createOrder = async function(req,res){ // input cancelable and status
    try{
        // validation of Objectid in params
        if(!ObjectId.isValid(req.params.userId)) return res.status(400).send({status:false,msg:'enter a valid objectId in params'})
        // check authorisation of the user
        if(req.userId != req.params.userId) return res.status(403).send({status:false,msg:'you are not authorized'})

        let user = await userModel.findById(req.params.userId);
        // !  status code doubt
        if(!user) return res.status(404).send({status:false,msg:'no user found'}) 

        //check body is empty or not
        if(Object.keys(req.body).length == 0 ) return res.status(400).send({status:false,msg:"enter the order details"})
        let data = req.body; // cart details (userId,items, totalItems, totalPrice,totalQuantity)

        if(!data.totalQuantity){
        let totalQuantity = 0;
        // can use forEach, for loop also
        data.items.map(item => totalQuantity += item.quantity)
        data.totalQuantity = totalQuantity;
        }
        if(data.cancellable){
            if(![true,false].includes(data.cancellable)) return res.status(400).send({status:false,msg:'enter cancellable in proper format'})
       }
       if(data.status) return res.status(400).send({status:false,msg:'you are not allowed to give status of the product'})

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

       let {status,orderId} = req.body;

       if(!['completed', 'cancelled'].includes(status)) return res.status(400).send({status:false,msg:'status should take only cancelled, completed'})
       if(!ObjectId.isValid(orderId)) return res.status(400).send({status:false,msg:'orderId is not valid'})

       let order = await orderModel.findOne({isDeleted:false,_id:orderId});

       if(!order) return res.status(404).send({status:false,msg:'order is not present, create the order first'})

       if(order.status == 'completed') return res.status(400).send({status:false,msg:'order is already completed, cannot be changed now'})
       if(order.status == "cancelled") return res.status(400).send({status:false,msg:"order is already cancelled,cannot be changed now"})

       // for the order.status == "pending"
       if(order.cancellable == false && status == "cancelled") return res.status(400).send({status:false,msg:"order cannot be cancelled"})

       if(order.cancellable == true && status == "cancelled"){
          let  updatedOrder = await orderModel.findByIdAndUpdate(orderId, {status : status}, {new:true})
           return res.status(200).send({status:true,msg:'order is cancelled', data : updatedOrder})
       }
       if(status == "completed"){
        let  updatedOrder = await orderModel.findByIdAndUpdate(orderId, {status : status}, {new:true})
        return res.status(200).send({status:true,msg:'order is completed', data : updatedOrder})
       }


    }catch(error){
        return res.status(500).send({status:false,msg:error.message})
    }
}

module.exports.createOrder = createOrder;
module.exports.updateOrder = updateOrder;