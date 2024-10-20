const Product = require('../models/Product')
const Category = require('../models/Category')

const getAllProducts = async (req, res) => {
  try {
    // Use populate to fetch the category name
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
  const {
    name,
    price,
    description,
    stock,
    category: categoryName,
    imageUrl,
  } = req.body

  // Improved validation
  if (
    !name ||
    typeof price !== 'number' ||
    !description ||
    typeof stock !== 'number' ||
    !categoryName || // we're looking for a category by name
    !imageUrl
  ) {
    return res
      .status(400)
      .json({ error: 'Please provide valid data for all required fields' })
  }

  // Check if a product with the same name already exists
  const duplicate = await Product.findOne({ name }).lean().exec()
  if (duplicate) {
    return res
      .status(400)
      .json({ error: 'Product with this name already exists' })
  }

  try {
    // Check if the category exists
    let category = await Category.findOne({ name: categoryName }).exec()

    if (!category) {
      return res.status(400).json({ error: 'Category not found' })
    }

    // Now create the product with the category's ID
    const product = await Product.create({
      name,
      price,
      description,
      stock,
      category: category._id, // store the category's ObjectId
      imageUrl,
    })

    return res.status(201).json(product)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create product' })
  }
}

const updateProduct = async (req, res) => {
  const { name, price, description, stock, category, imageUrl } = req.body

  if (
    !name ||
    typeof price !== 'number' ||
    !description ||
    typeof stock !== 'number' ||
    !category ||
    !imageUrl
  ) {
    return res
      .status(400)
      .json({ error: 'Please provide valid data for all required fields' })
  }

  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, description, stock, category, imageUrl },
      { new: true }
    )
    res.status(200).json(product)
  } catch (error) {
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
