const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId
const cartSchema = new mongoose.Schema({
    userId: {
        type:ObjectId ,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [{
            _id:false, // works as select(_id : false) // remove the newly created "_id" in the product,
        productId: { type: ObjectId,
             required: true,
              ref:'product' },
              
        quantity: { type: Number, required: true }
    }],
    totalItems: {
        type:Number,
        default: 0
    },
    totalPrice :{
        type : Number,
        default : 0
    }
},{timestamps: true})
module.exports = mongoose.model("Cart",cartSchema)