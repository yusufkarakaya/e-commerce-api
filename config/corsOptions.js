const allowedOrigins = require('./allowedOrigins')

const corsOptions = {
  origin: (origin, callback) => {
    // Eğer istek allowedOrigins listesindeki bir kaynaktan geliyorsa izin ver
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      // !origin kontrolü, Postman veya server'dan direkt yapılan istekler için
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  optionsSuccessStatus: 200, // Eski tarayıcılar için başarılı durum kodu
  credentials: true, // Özel oturum tanımlamaları için gerekli
}

module.exports = corsOptions
