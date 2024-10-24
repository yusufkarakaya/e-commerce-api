const jwtf = require('jsonwebtoken')

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.authorization

  if (!authHeader?.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]

  jwtf.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    req.user = decoded.userId
    next()
  })
}

module.exports = verifyJWT
