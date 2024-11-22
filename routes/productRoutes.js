const express = require('express')
const router = express.Router()
const productController = require('../controllers/productController')
const upload = require('../middleware/upload')

router
  .route('/')
  .get(productController.getAllProducts) // Fetch all products
  .post(upload.array('images', 10), productController.createProduct) // Create a new product (with up to 10 images)

router
  .route('/:id')
  .get(productController.getProductById) // Fetch product by ID
  .patch(upload.array('images', 10), productController.updateProduct) // Update product details
  .delete(productController.deleteProduct) // Delete a product

// Route for deleting a specific product image
router.route('/:productId/images').delete(productController.deleteProductImage) // Delete a specific image from a product

module.exports = router
