const User = require('../models/User')
const cartService = require('../services/cartService')

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const guestId = req.cookies.guestId

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Convert guest cart if exists
    if (guestId) {
      await cartService.convertGuestCart(guestId, user._id)
      res.clearCookie('guestId')
    }

    const token = user.generateAuthToken()
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Error during login' })
  }
}

// ... rest of the controller methods ... 