const Product = require('../models/Product')
const Category = require('../models/Category')
const mongoose = require('mongoose')
const { ObjectId } = mongoose.Types
const cloudinary = require('cloudinary').v2

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
  try {
    const { name, price, description, stock, category } = req.body

    if (!name || !price || !description || !stock || !category) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    let images = []
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.path)
    }

    const product = await Product.create({
      name,
      price: parseFloat(price),
      description,
      stock: parseInt(stock),
      category,
      images,
    })

    res.status(201).json(product)
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({ message: 'Error creating product' })
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

    if (req.files && req.files.length > 0) {
      const imageUploads = await Promise.all(
        req.files.map((file) =>
          cloudinary.uploader.upload(file.path, { folder: 'ecommerce' })
        )
      )

      const newImageUrls = imageUploads.map((result) => result.secure_url)

      // `images` dizisine yeni URL'leri ekliyoruz
      updatedData.$push = { images: { $each: newImageUrls } }
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
      const publicId = product.imageUrl.split('/').pop().split('.')[0]
      await cloudinary.uploader.destroy(
        `ecommerce/${publicId}`,
        (error, result) => {
          if (error) {
            console.error('Error while deleting product image:', error)
          } else {
            console.log('Product image deleted successfully', result)
          }
        }
      )
    }

    await product.deleteOne()
    return res.status(200).json({ message: 'Product deleted successfully' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const deleteProductImage = async (req, res) => {
  const { image } = req.body
  const { productId } = req.params

  try {
    const product = await Product.findById(productId)

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $pull: { images: image } },
        { new: true }
      )

      if (!updatedProduct) {
        return res.status(404).json({ error: 'Error updating product' })
      }

      const publicId = image.split('/').slice(-1)[0].split('.')[0]
      await cloudinary.uploader.destroy(`products/${publicId}`)

      res.status(200).json({ message: 'Image deleted successfully' })
    } catch (error) {
      console.error('Error:', error)
      res.status(500).json({ error: 'Error processing request' })
    }
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
}
