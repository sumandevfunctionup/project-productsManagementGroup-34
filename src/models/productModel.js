const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
        title: {type:String,required:true,unique : true, trim : true},
        description: {type:String,required:true, trim : true},
        price: {type:Number,required:true},
        currencyId: {type:String,required:true, trim : true},
        currencyFormat: {type:String},
        isFreeShipping: {type:Boolean, default: false},
        productImage: {type:String, trim : true},  // s3 link
        style: {type:String},
        availableSizes: {type:[]},
        installments: {type:Number},
        deletedAt: {type:Date}, 
        isDeleted: {type:Boolean, default: false}
}, {timestamps: true})

module.exports = mongoose.model('product', productSchema)