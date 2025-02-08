const express = require('express')
const router = express.Router()
const cartController = require('../controllers/cartController')
const guestMiddleware = require('../middleware/guestMiddleware')

// Get cart
router.get('/', guestMiddleware, cartController.getUserCart)

// Add product to cart
router.post('/product', guestMiddleware, cartController.addProductToCart)

// Remove product from cart
router.delete('/product/:productId', guestMiddleware, cartController.removeProductFromCart)

// Update product quantity
router.put('/product/:productId/increase', guestMiddleware, cartController.increaseProductQuantity)
router.put('/product/:productId/decrease', guestMiddleware, cartController.decreaseProductQuantity)

// Clear cart
router.delete('/clear', guestMiddleware, cartController.clearCart)

module.exports = router
