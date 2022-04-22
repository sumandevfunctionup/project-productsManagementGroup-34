const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId
const orderSchema = new mongoose.Schema({
    userId:{type:ObjectId,ref:"User", required:true},
    items : {type:[{
        productId : ObjectId,quantity : Number
    }]},
    totalPrice : Number,
    totalItems : Number,
    totalQuantity : Number,
    cancellable : {type : Boolean,default:true},
    status: {type:String,default : 'pending', enum:['pending','completed', 'cancelled']},
    deletedAt : Date,
    isDeleted : {type : Boolean, default : false}
},{timestamps: true})

module.exports = mongoose.model("Order",orderSchema)