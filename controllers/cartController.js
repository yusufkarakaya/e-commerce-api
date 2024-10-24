const Cart = require('../models/Cart')
const User = require('../models/User')
const Product = require('../models/Product')
const mongoose = require('mongoose')

const getUserCart = async (req, res) => {
  const userId = req.user

  try {
    if (!userId) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    const cart = await Cart.findOne({ user: userId })
      .populate('user', 'username')
      .populate({
        path: 'products.product',
        select: 'name price imageUrl description stock',
      })
      .lean()
      .exec()

    if (!cart) {
      return res.status(404).json({ message: 'No cart found for this user' })
    }

    return res.status(200).json(cart)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const getCartById = async (req, res) => {
  const { id } = req.params
  const user = req.user

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid Cart ID' })
  }

  try {
    if (!user) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    const cart = await Cart.findById(id)
      .populate('user', 'username')
      .populate({
        path: 'products.product',
        select: 'name price imageUrl description stock',
      })
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

const addProductToCart = async (req, res) => {
  const { product, quantity } = req.body
  const userId = req.user

  if (!product || !quantity) {
    return res
      .status(400)
      .json({ message: 'Product ID and quantity are required.' })
  }

  if (!mongoose.isValidObjectId(product)) {
    return res.status(400).json({ message: 'Invalid Product ID.' })
  }

  try {
    const productExists = await Product.findById(product)
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    // Check if the user's cart already exists
    let cart = await Cart.findOne({ user: userId })

    if (cart) {
      // If the cart exists, check if the product is already in the cart
      const productIndex = cart.products.findIndex(
        (item) => item.product.toString() === product
      )

      if (productIndex > -1) {
        // If product exists in cart, update the quantity
        cart.products[productIndex].quantity += quantity
      } else {
        // If product does not exist, add it to the cart
        cart.products.push({ product: product, quantity })
      }
    } else {
      // If no cart exists for this user, create a new one
      cart = await Cart.create({
        user: userId,
        products: [{ product: product, quantity }],
        totalPrice: productExists.price * quantity,
      })
    }

    // Recalculate total price of the cart
    let totalPrice = 0
    for (const item of cart.products) {
      const itemProduct = await Product.findById(item.product)
      totalPrice += itemProduct.price * item.quantity
    }

    cart.totalPrice = Number(totalPrice.toFixed(2))

    await cart.save()
    return res.status(201).json(cart)
  } catch (error) {
    console.error('Error:', error.message) // Log the error to understand the issue
    return res.status(500).json({ message: error.message })
  }
}

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

const removeProductFromCart = async (req, res) => {
  const userId = req.user
  const { productId } = req.params

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ message: 'Invalid Product ID' })
  }

  try {
    let cart = await Cart.findOne({ user: userId })

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    // Remove product from cart
    const productIndex = cart.products.findIndex(
      (item) => item.product.toString() === productId
    )

    if (productIndex > -1) {
      cart.products.splice(productIndex, 1)
    } else {
      return res.status(404).json({ message: 'Product not found in cart' })
    }

    // Save updated cart
    await cart.save()

    return res.status(200).json({ message: 'Product removed successfully' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const increaseProductQuantity = async (req, res) => {
  const userId = req.user
  const { productId } = req.params

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ message: 'Invalid Product ID' })
  }

  try {
    let cart = await Cart.findOne({ user: userId })

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    const productIndex = cart.products.findIndex(
      (item) => item.product.toString() === productId
    )

    if (productIndex > -1) {
      // Increase the product quantity
      cart.products[productIndex].quantity += 1
    } else {
      return res.status(404).json({ message: 'Product not found in cart' })
    }

    // Save updated cart
    await cart.save()

    return res
      .status(200)
      .json({ message: 'Product quantity increased successfully' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const decreaseProductQuantity = async (req, res) => {
  const userId = req.user
  const { productId } = req.params

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ message: 'Invalid Product ID' })
  }

  try {
    let cart = await Cart.findOne({ user: userId })

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    const productIndex = cart.products.findIndex(
      (item) => item.product.toString() === productId
    )

    if (productIndex > -1) {
      // Decrease the product quantity
      if (cart.products[productIndex].quantity > 1) {
        cart.products[productIndex].quantity -= 1
      } else {
        // Remove the product from the cart if the quantity is 1 and they decrease it
        cart.products.splice(productIndex, 1)
      }
    } else {
      return res.status(404).json({ message: 'Product not found in cart' })
    }

    await cart.save()

    return res
      .status(200)
      .json({ message: 'Product quantity decreased successfully' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  getUserCart,
  getCartById,
  addProductToCart,
  updateCart,
  removeProductFromCart,
  decreaseProductQuantity,
  increaseProductQuantity,
}
