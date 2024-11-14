require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const { logger } = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
const cookieParser = require('cookie-parser')
const corsOptions = require('./config/corsOptions')
const cors = require('cors')
const connectDB = require('./config/dbConn')
const mongoose = require('mongoose')

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const PORT = process.env.PORT || 3500

console.log(process.env.NODE_ENV)
connectDB()

app.use(logger)
app.use(express.json())
app.use(cookieParser())
app.use(cors(corsOptions))

// Static dosyalar
app.use('/', express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'views')))

// API rotaları
app.use('/', require('./routes/root.js'))
app.use('/api/users', require('./routes/userRoutes.js'))
app.use('/api/products', require('./routes/productRoutes.js'))
app.use('/api/category', require('./routes/categoryRoutes.js'))
app.use('/api/orders', require('./routes/orderRoutes.js'))
app.use('/api/cart', require('./routes/cartRoutes.js'))
app.use('/api/auth', require('./routes/authRoutes.js'))
app.use('/api/checkout', require('./routes/checkoutRoutes.js'))

if (process.env.NODE_ENV === 'production') {
  // Frontend build klasörünü statik olarak serve et
  app.use(express.static(path.join(__dirname, '../ecommerce-frontend/dist')))

  // Tüm GET isteklerini frontend'e yönlendir
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../ecommerce-frontend/dist/index.html'))
  })
}

// Eğer başka bir rota bulunamazsa index.html dosyasını gönder
// Bu, React Router tarafından client-side routing için kullanılır
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'views', 'index.html'))
})

// Hata yönetimi middleware'i
app.use(errorHandler)

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB')
  app.listen(PORT, () =>
    console.log(`Server is running on http://localhost:${PORT}`)
  )
})

mongoose.connection.on('error', (error) => console.error(error))
