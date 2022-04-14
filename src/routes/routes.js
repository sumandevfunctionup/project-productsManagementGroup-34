const express = require('express');
const router = express.Router();
const userController = require("../controllers/userController")
const cartController = require("../controllers/cartController")
const productController = require("../controllers/productController")
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

module.exports = router;
