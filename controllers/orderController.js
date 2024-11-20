const Order = require('../models/Order')
const Product = require('../models/Product')
const User = require('../models/User')

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'username')
      .populate('products.product', 'name')
      .lean()
      .exec()

    if (!orders.length) {
      return res.status(404).json({ message: 'No orders found' })
    }

    return res.status(200).json(orders)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const getOrderById = async (req, res) => {
  const { id } = req.params

  try {
    const order = await Order.findById(id)
      .populate('user', 'username')
      .populate('products.product', 'name')
      .lean()
      .exec()

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    return res.status(200).json(order)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const createOrder = async (req, res) => {
  const { user, products, status } = req.body

  if (!user || !products || !products.length) {
    return res
      .status(400)
      .json({ error: 'Please provide valid data for all required fields' })
  }

  const userExists = await User.findById(user).exec()
  if (!userExists) {
    return res.status(404).json({ error: 'User not found' })
  }

  const productIds = products.map((item) => item.product)
  const productsExist = await Product.find({ _id: { $in: productIds } }).exec()

  if (!productsExist.length) {
    return res.status(404).json({ error: 'Products not found' })
  }

  let totalPrice = products.reduce((acc, item) => {
    const product = productsExist.find((p) => p._id.toString() === item.product)
    return acc + product.price * item.quantity
  }, 0)

  totalPrice = Number(totalPrice.toFixed(2))

  const newOrder = new Order({
    user,
    products: products.map((item) => ({
      product: item.product,
      quantity: item.quantity,
    })),
    totalPrice,
    status: status || 'pending',
  })

  try {
    const order = await newOrder.save()
    return res.status(201).json(order)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const updateOrder = async (req, res) => {
  const { id } = req.params
  const { user, products, status } = req.body

  if (!user || !products || !products.length) {
    return res
      .status(400)
      .json({ error: 'Please provide valid data for all required fields' })
  }

  const userExists = await User.findById(user).exec()
  if (!userExists) {
    return res.status(404).json({ error: 'User not found' })
  }

  const productIds = products.map((item) => item.product)
  const productsExists = await Product.find({ _id: { $in: productIds } }).exec()

  if (!productsExists.length) {
    return res.status(404).json({ error: 'Products not found' })
  }

  let totalPrice = products.reduce((acc, item) => {
    const product = productsExists.find(
      (product) => product._id.toString() === item.product
    )
    return acc + product.price * item.quantity
  }, 0)

  totalPrice = Number(totalPrice.toFixed(2))

  try {
    const order = await Order.findByIdAndUpdate(
      id,
      {
        user,
        products: products.map((item) => ({
          product: item.product,
          quantity: item.quantity,
        })),
        totalPrice,
        status: status || 'pending',
      },
      { new: true }
    )

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    return res.status(200).json(order)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const deleteOrder = async (req, res) => {
  const { id } = req.params

  try {
    const order = await Order.findByIdAndDelete(id)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    return res.status(200).json({ message: 'Order deleted successfully' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
}
