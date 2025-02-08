const { v4: uuidv4 } = require('uuid')

const guestMiddleware = (req, res, next) => {
  // Check for existing guestId in cookies
  let guestId = req.cookies.guestId

  // If no guestId and user is not authenticated, create one
  if (!guestId && !req.user) {
    guestId = uuidv4()
    // Set cookie with guestId
    res.cookie('guestId', guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    })
  }

  // Attach guestId to request object
  req.guestId = guestId
  next()
}

module.exports = guestMiddleware 