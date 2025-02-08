const Cart = require('../models/Cart')
const { v4: uuidv4 } = require('uuid')

const cartService = {
  // Get or create cart
  async getOrCreateCart(userId, guestId) {
    let cart

    if (userId) {
      // Try to find user's cart
      cart = await Cart.findOne({ user: userId }).populate('products.product')
      
      if (!cart && guestId) {
        // If user has no cart but has a guest cart, convert it
        cart = await this.convertGuestCart(guestId, userId)
      }
    } else if (guestId) {
      // Try to find guest cart
      cart = await Cart.findOne({ guestId }).populate('products.product')
    }

    // If no cart exists, create a new one
    if (!cart) {
      cart = await Cart.create({
        user: userId || null,
        guestId: !userId ? (guestId || uuidv4()) : null,
        products: []
      })
    }

    return cart
  },

  // Convert guest cart to user cart
  async convertGuestCart(guestId, userId) {
    const guestCart = await Cart.findOne({ guestId })
    
    if (!guestCart) {
      return null
    }

    // Check if user already has a cart
    const existingUserCart = await Cart.findOne({ user: userId })

    if (existingUserCart) {
      // Merge guest cart into user cart
      existingUserCart.products = this.mergeCartProducts(
        existingUserCart.products,
        guestCart.products
      )
      await existingUserCart.save()
      await guestCart.remove()
      return existingUserCart
    }

    // Convert guest cart to user cart
    guestCart.user = userId
    guestCart.guestId = null
    await guestCart.save()
    return guestCart
  },

  // Merge cart products
  mergeCartProducts(userProducts, guestProducts) {
    const mergedProducts = [...userProducts]

    guestProducts.forEach(guestItem => {
      const existingIndex = mergedProducts.findIndex(
        item => item.product.toString() === guestItem.product.toString()
      )

      if (existingIndex > -1) {
        mergedProducts[existingIndex].quantity += guestItem.quantity
      } else {
        mergedProducts.push(guestItem)
      }
    })

    return mergedProducts
  }
}

module.exports = cartService 