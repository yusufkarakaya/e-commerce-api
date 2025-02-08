require('dotenv').config()
const express = require('express')
const router = express.Router()
const checkoutController = require('../controllers/checkoutController')
const guestMiddleware = require('../middleware/guestMiddleware')

// Create checkout session route
router.post(
  '/create-checkout-session',
  guestMiddleware,
  checkoutController.createCheckoutSession
)

// Handle successful checkout
router.get(
  '/success',
  guestMiddleware,
  checkoutController.handleCheckoutSuccess
)

module.exports = router
