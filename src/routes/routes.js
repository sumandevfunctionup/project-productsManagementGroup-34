const express = require('express');
const router = express.Router();

const userController = require("../controllers/userController")
const productController = require("../controllers/productController")
const cartController = require("../controllers/cartController")
const orderController = require("../controllers/orderController")
const auth = require('../auth/auth')

// user APIs
router.post("/register", userController.userRegister);
router.post("/login", userController.login);
router.get("/user/:userId/profile",auth.authentication, userController.getUser) 
router.put("/user/:userId/profile",auth.authentication, userController.updateUser) 


// product APIs
router.post('/products', productController.create)
router.get('/products', productController.getProducts)
router.get('/products/:productId', productController.getProductById)
router.delete('/products/:productId', productController.deleteProductById)
router.put('/products/:productId', productController.updateProductById)

// cart APIs
router.post('/users/:userId/cart', auth.authentication,cartController.addItems)
router.put('/users/:userId/cart', auth.authentication,cartController.removeItems)
router.get('/users/:userId/cart', auth.authentication, cartController.getCart)
router.delete('/users/:userId/cart', auth.authentication, cartController.deleteCart)

// order APIs
router.post('/users/:userId/orders', auth.authentication,orderController.createOrder)
router.put('/users/:userId/orders', auth.authentication, orderController.updateOrder)
module.exports = router;
