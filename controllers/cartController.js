const Cart = require('../models/Cart')
const User = require('../models/User')
const Product = require('../models/Product')
const mongoose = require('mongoose')

// @desc    Get all carts
// @route   GET /cart
// @access  Private
const getAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find()
      .populate('user', 'username')
      .populate('products.product', 'name')
      .lean()
      .exec()

    if (!carts.length) {
      return res.status(404).json({ message: 'No carts found' })
    }

    return res.status(200).json(carts)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// @desc    Get cart by ID
// @route   GET /cart/:id
// @access  Private
const getCartById = async (req, res) => {
  const { id } = req.params

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid Cart ID' })
  }

  try {
    const cart = await Cart.findById(id)
      .populate('user', 'username')
      .populate('products.product', 'name')
      .lean()
      .exec()

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    return res.status(200).json(cart)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// @desc    Create a new cart
// @route   POST /cart
// @access  Private
const createCart = async (req, res) => {
  const { user, products } = req.body

  // Check if user or products are missing
  if (!user || !products || !products.length) {
    // Send response and return to avoid sending another response later
    return res.status(400).json({ message: 'Please fill all fields' })
  }

  // Validate if user is a valid ObjectId
  if (!mongoose.isValidObjectId(user)) {
    // Send response and return to avoid sending another response later
    return res.status(400).json({ message: 'Invalid User ID' })
  }

  try {
    // Check if user exists
    const userExists = await User.findById(user)
    if (!userExists) {
      // Send response and return to avoid sending another response later
      return res.status(404).json({ message: 'User not found' })
    }

    // Validate product IDs and find product details
    const productsArray = await Promise.all(
      products.map(async (product) => {
        // Validate if product ID is a valid ObjectId
        if (!mongoose.isValidObjectId(product.product)) {
          throw new Error(`Invalid Product ID: ${product.product}`)
        }

        const productExists = await Product.findById(product.product)
        if (!productExists) {
          throw new Error(`Product not found: ${product.product}`)
        }

        return {
          product: product.product,
          quantity: product.quantity,
          price: productExists.price, // Include product price for total calculation
        }
      })
    )

    // Calculate total price
    let totalPrice = productsArray.reduce((acc, product) => {
      return acc + product.price * product.quantity
    }, 0)

    totalPrice = Number(totalPrice.toFixed(2))

    // Create new cart
    const newCart = await Cart.create({
      user,
      products: productsArray,
      totalPrice,
    })

    // Send the final response here
    return res.status(201).json(newCart)
  } catch (error) {
    // Catch any thrown errors related to invalid product or user
    // Send the error response and return to avoid multiple sends
    return res.status(400).json({ message: error.message })
  }
}

// @desc    Update cart by ID
// @route   PATCH /cart/:id
// @access  Private
const updateCart = async (req, res) => {
  const { id } = req.params
  const { user, products } = req.body

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid Cart ID' })
  }

  try {
    const cart = await Cart.findById(id)

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    if (user) {
      if (!mongoose.isValidObjectId(user)) {
        return res.status(400).json({ message: 'Invalid User ID' })
      }

      const userExists = await User.findById(user)
      if (!userExists) {
        return res.status(404).json({ message: 'User not found' })
      }
    }

    if (products) {
      const productsArray = await Promise.all(
        products.map(async (product) => {
          if (!mongoose.isValidObjectId(product.product)) {
            throw new Error(`Invalid Product ID: ${product.product}`)
          }

          const productExists = await Product.findById(product.product)
          if (!productExists) {
            throw new Error(`Product not found: ${product.product}`)
          }

          return {
            product: product.product,
            quantity: product.quantity,
            price: productExists.price,
          }
        })
      )

      let totalPrice = productsArray.reduce((acc, product) => {
        return acc + product.price * product.quantity
      }, 0)

      totalPrice = Number(totalPrice.toFixed(2))

      cart.products = productsArray
      cart.totalPrice = totalPrice
    }

    if (user) {
      cart.user = user
    }

    await cart.save()

    return res.status(200).json(cart)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// @desc    Delete cart by ID
// @route   DELETE /cart/:id
// @access  Private
const deleteCart = async (req, res) => {
  const { id } = req.params

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid Cart ID' })
  }

  try {
    const cart = await Cart.findByIdAndDelete(id)

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    return res.status(200).json({ message: 'Cart deleted successfully' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  getAllCarts,
  getCartById,
  createCart,
  updateCart,
  deleteCart,
}
