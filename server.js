require('dotenv').config()
const express = require('express')
const path = require('path')
const { logger } = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const corsOptions = require('./config/corsOptions')
const cors = require('cors')
const connectDB = require('./config/dbConn')
const mongoose = require('mongoose')

// Import security packages
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const compression = require('compression')

const app = express()
const PORT = process.env.PORT || 3500

// Basic middleware
app.use(logger)
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}))

// Security middleware
app.use(helmet())
app.use(mongoSanitize())
app.use(xss())
app.use(hpp())
app.use(compression())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { message: 'Too many requests, please try again later.' }
})
app.use('/api', limiter)

// Routes
app.use('/', require('./routes/root'))
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/users', require('./routes/userRoutes'))
app.use('/api/products', require('./routes/productRoutes'))
app.use('/api/categories', require('./routes/categoryRoutes'))
app.use('/api/cart', require('./routes/cartRoutes'))
app.use('/api/orders', require('./routes/orderRoutes'))
app.use('/api/checkout', require('./routes/checkoutRoutes'))

// Make sure this comes after all route definitions
app.use((req, res, next) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.url}` })
})

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../ecommerce-frontend/dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../ecommerce-frontend/dist/index.html'))
  })
}

app.use(errorHandler)

// Connect to MongoDB and start server
mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB')
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err)
})

connectDB()
