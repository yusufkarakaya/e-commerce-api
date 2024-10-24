const express = require('express')
const router = express.Router()
const productController = require('../controllers/productController')
const upload = require('../middleware/upload')

router
  .route('/')
  .get(productController.getAllProducts)
  .post(upload.single('imageUrl'), productController.createProduct)

router
  .route('/:id')
  .get(productController.getProductById)
  .patch(upload.single('imageUrl'), productController.updateProduct)
  .delete(productController.deleteProduct)

module.exports = router
