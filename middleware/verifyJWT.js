const jwt = require('jsonwebtoken')

const verifyJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const token = authHeader.split(' ')[1]
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token' })
      }
      req.user = decoded.UserInfo
      next()
    })
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token format' })
  }
}

module.exports = verifyJWT
