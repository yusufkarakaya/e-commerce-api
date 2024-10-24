const Product = require('../models/Product')
const Category = require('../models/Category')
const mongoose = require('mongoose')
const { ObjectId } = mongoose.Types
const fs = require('fs')

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category', 'name').exec()

    if (!products.length) {
      return res.status(404).json({ message: 'No products found' })
    }

    return res.status(200).json(products)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const getProductById = async (req, res) => {
  const { id } = req.params

  try {
    const product = await Product.findById(id)
      .populate('category', 'name')
      .exec()

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    return res.status(200).json(product)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const createProduct = async (req, res) => {
  const { name, price, description, stock, category: categoryId } = req.body

  const imageUrl = req.file ? req.file.path : null

  if (
    !name ||
    isNaN(Number(price)) ||
    !description ||
    isNaN(Number(stock)) ||
    !categoryId ||
    !imageUrl
  ) {
    return res
      .status(400)
      .json({ error: 'Please provide valid data for all required fields' })
  }
  const duplicate = await Product.findOne({ name }).lean().exec()
  if (duplicate) {
    return res
      .status(400)
      .json({ error: 'Product with this name already exists' })
  }

  try {
    let category = await Category.findById(categoryId).exec()

    if (!category) {
      return res.status(400).json({ error: 'Category not found' })
    }
    const product = await Product.create({
      name,
      price,
      description,
      stock,
      category: category._id,
      imageUrl,
    })

    return res.status(201).json(product)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create product' })
  }
}

const updateProduct = async (req, res) => {
  let { name, price, description, stock, category } = req.body

  // Convert `price` and `stock` to numbers
  price = parseFloat(price)
  stock = parseInt(stock)

  try {
    if (!ObjectId.isValid(category)) {
      return res.status(400).json({ error: 'Invalid category ID' })
    }

    const updatedData = {
      name,
      price,
      description,
      stock,
      category,
    }

    if (req.file) {
      updatedData.imageUrl = req.file.path // Assuming you're storing the image path in `imageUrl`
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    )

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.status(200).json(product)
  } catch (error) {
    console.error('Error while updating product:', error)
    res.status(500).json({ error: 'Invalid product data received' })
  }
}

const deleteProduct = async (req, res) => {
  const { id } = req.params

  if (!id) {
    return res.status(400).json({ error: 'Please provide product id' })
  }

  try {
    const product = await Product.findById(id)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    if (product.imageUrl) {
      fs.unlinkSync(product.imageUrl),
        (err) => {
          if (err) {
            console.error('Error while deleting product image:', err)
          } else {
            console.log('Product image deleted successfully')
          }
        }
    }

    await product.deleteOne()
    return res.status(200).json({ message: 'Product deleted successfully' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
}
