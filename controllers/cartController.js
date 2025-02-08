const Cart = require('../models/Cart')
const Product = require('../models/Product')
const cartService = require('../services/cartService')

// Merge guest cart with user cart
const mergeGuestCart = async (guestId, userId) => {
  try {
    const [guestCart, userCart] = await Promise.all([
      Cart.findOne({ guestId }).populate('products.product'),
      Cart.findOne({ user: userId }).populate('products.product')
    ])

    if (!guestCart) return null

    if (!userCart) {
      // If user has no cart, convert guest cart to user cart
      guestCart.user = userId
      guestCart.guestId = null
      await guestCart.save()
      return guestCart
    }

    // Merge products from guest cart to user cart
    for (const guestItem of guestCart.products) {
      const existingProduct = userCart.products.find(
        userItem => userItem.product._id.toString() === guestItem.product._id.toString()
      )

      if (existingProduct) {
        existingProduct.quantity += guestItem.quantity
      } else {
        userCart.products.push({
          product: guestItem.product._id,
          quantity: guestItem.quantity
        })
      }
    }

    await userCart.save()
    await Cart.deleteOne({ _id: guestCart._id })
    
    await userCart.populate({
      path: 'products.product',
      model: 'Product',
      select: 'name price images stock'
    })
    
    return userCart
  } catch (error) {
    console.error('Error merging carts:', error)
    return null
  }
}

// Get user cart
const getUserCart = async (req, res) => {
  try {
    const userId = req.user?.id
    const guestId = req.guestId

    let cart

    if (userId) {
      // If user is logged in, always get their cart
      cart = await Cart.findOne({ user: userId }).populate({
        path: 'products.product',
        model: 'Product',
        select: 'name price images stock'
      })

      // If user has no cart, create one
      if (!cart) {
        cart = new Cart({
          user: userId,
          products: []
        })
        await cart.save()
      }

      // If there's a guest cart with items, merge it
      if (guestId) {
        const guestCart = await Cart.findOne({ guestId })
        if (guestCart && guestCart.products.length > 0) {
          const mergedCart = await mergeGuestCart(guestId, userId)
          if (mergedCart) {
            cart = mergedCart
          }
        }
      }
    } else if (guestId) {
      // If guest user, get or create guest cart
      cart = await Cart.findOne({ guestId }).populate({
        path: 'products.product',
        model: 'Product',
        select: 'name price images stock'
      })

      if (!cart) {
        cart = new Cart({
          guestId: guestId,
          products: []
        })
        await cart.save()
      }
    }

    console.log('Cart found:', cart) // Debug log
    res.json(cart)
  } catch (error) {
    console.error('Get cart error:', error)
    res.status(500).json({ message: 'Error fetching cart' })
  }
}

// Add product to cart
const addProductToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body
    const userId = req.user?.id
    const guestId = req.guestId

    // Verify product exists and has enough stock
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' })
    }

    let cart

    if (userId) {
      // If user is logged in, find or create their cart
      cart = await Cart.findOne({ user: userId })
      if (!cart) {
        cart = new Cart({
          user: userId,
          products: []
        })
      }
    } else if (guestId) {
      // If guest user, find or create guest cart
      cart = await Cart.findOne({ guestId })
      if (!cart) {
        cart = new Cart({
          guestId: guestId,
          products: []
        })
      }
    }

    if (!cart) {
      return res.status(400).json({ message: 'Unable to create cart' })
    }

    const existingProductIndex = cart.products.findIndex(
      item => item.product.toString() === productId
    )

    if (existingProductIndex > -1) {
      cart.products[existingProductIndex].quantity += quantity
    } else {
      cart.products.push({ product: productId, quantity })
    }

    await cart.save()
    await cart.populate({
      path: 'products.product',
      model: 'Product',
      select: 'name price images stock'
    })

    console.log('Updated cart:', cart) // Debug log
    res.json(cart)
  } catch (error) {
    console.error('Add to cart error:', error)
    res.status(500).json({ message: 'Error adding product to cart' })
  }
}

// Remove product from cart
const removeProductFromCart = async (req, res) => {
  try {
    const { productId } = req.params
    const userId = req.user?.id
    const guestId = req.guestId

    const cart = await Cart.findOne(
      userId ? { user: userId } : { guestId: guestId }
    )

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    cart.products = cart.products.filter(
      (item) => item.product.toString() !== productId
    )

    await cart.save()
    await cart.populate({
      path: 'products.product',
      model: 'Product',
      select: 'name price images stock'
    })

    res.json(cart)
  } catch (error) {
    console.error('Remove product error:', error)
    res.status(500).json({ message: 'Error removing product from cart' })
  }
}

// Increase product quantity
const increaseProductQuantity = async (req, res) => {
  try {
    const { productId } = req.params
    const userId = req.user?.id
    const guestId = req.guestId

    const cart = await Cart.findOne(
      userId ? { user: userId } : { guestId: guestId }
    )

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    const productIndex = cart.products.findIndex(
      (item) => item.product.toString() === productId
    )

    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found in cart' })
    }

    // Check stock before increasing
    const product = await Product.findById(productId)
    if (!product || product.stock <= cart.products[productIndex].quantity) {
      return res.status(400).json({ message: 'Not enough stock available' })
    }

    cart.products[productIndex].quantity += 1
    await cart.save()
    await cart.populate({
      path: 'products.product',
      model: 'Product',
      select: 'name price images stock'
    })

    res.json(cart)
  } catch (error) {
    console.error('Increase quantity error:', error)
    res.status(500).json({ message: 'Error increasing product quantity' })
  }
}

// Decrease product quantity
const decreaseProductQuantity = async (req, res) => {
  try {
    const { productId } = req.params
    const userId = req.user?.id
    const guestId = req.guestId

    const cart = await Cart.findOne(
      userId ? { user: userId } : { guestId: guestId }
    )

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    const productIndex = cart.products.findIndex(
      (item) => item.product.toString() === productId
    )

    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found in cart' })
    }

    if (cart.products[productIndex].quantity > 1) {
      cart.products[productIndex].quantity -= 1
    } else {
      cart.products.splice(productIndex, 1)
    }

    await cart.save()
    await cart.populate({
      path: 'products.product',
      model: 'Product',
      select: 'name price images stock'
    })

    res.json(cart)
  } catch (error) {
    console.error('Decrease quantity error:', error)
    res.status(500).json({ message: 'Error decreasing product quantity' })
  }
}

// Clear cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user?.id
    const guestId = req.guestId

    const cart = await Cart.findOne(
      userId ? { user: userId } : { guestId: guestId }
    )

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    cart.products = []
    await cart.save()

    res.json(cart)
  } catch (error) {
    console.error('Clear cart error:', error)
    res.status(500).json({ message: 'Error clearing cart' })
  }
}

module.exports = {
  addProductToCart,
  getUserCart,
  removeProductFromCart,
  increaseProductQuantity,
  decreaseProductQuantity,
  clearCart,
  mergeGuestCart
}
