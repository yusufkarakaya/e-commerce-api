require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const { logger, logEvents } = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
const cookieParser = require('cookie-parser')
const corsOptions = require('./config/corsOptions')
const cors = require('cors')
const connectDB = require('./config/dbConn')
const mongoose = require('mongoose')
const upload = require('./middleware/upload.js')

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const PORT = process.env.PORT || 3500

console.log(process.env.NODE_ENV)
connectDB()

app.use(logger)
app.use(express.json())
app.use(cookieParser())
app.use(cors(corsOptions))

app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/', require('./routes/root'))
app.use('/users', require('./routes/userRoutes.js'))
app.use('/products', require('./routes/productRoutes.js'))
app.use('/category', require('./routes/categoryRoutes.js'))
app.use('/orders', require('./routes/orderRoutes.js'))
app.use('/cart', require('./routes/cartRoutes.js'))
app.use('/auth', require('./routes/authRoutes.js'))

// Serve the index.html file for any other routes (client-side routing support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.all('*', (req, res) => {
  res.status(404)
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'views', '404.html'))
  } else if (req.accepts('json')) {
    res.json({ error: 'Not Found' })
  } else {
    res.type('txt').send('Not Found')
  }
})

app.use(errorHandler)

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB')
  app.listen(PORT, () =>
    console.log(`Server is running on http://localhost:${PORT}`)
  )
})

mongoose.connection.on('error', (error) => console.error(error))
