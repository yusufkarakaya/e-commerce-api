const express = require('express')
const router = express.Router()
const cartController = require('../controllers/cartController')
const verifyJWT = require('../middleware/verifyJWT')

router.route('/').get(verifyJWT, cartController.getUserCart)
router.route('/add').post(verifyJWT, cartController.addProductToCart)

router
  .route('/:id')
  .get(cartController.getCartById)
  .patch(cartController.updateCart)

router
  .route('/product/:productId')
  .delete(verifyJWT, cartController.removeProductFromCart)

router
  .route('/product/:productId/increase')
  .post(verifyJWT, cartController.increaseProductQuantity)
router
  .route('/product/:productId/decrease')
  .post(verifyJWT, cartController.decreaseProductQuantity)

router.post('/clearCart', verifyJWT, cartController.clearCart)

module.exports = router
