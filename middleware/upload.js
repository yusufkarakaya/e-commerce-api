const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('cloudinary').v2

// Cloudinary konfigürasyonu
cloudinary.config({
  cloud_name: process.env.CLOUDNAME, // Cloudinary hesabınızdaki cloud_name
  api_key: process.env.API_KEY, // Cloudinary API key
  api_secret: process.env.API_SECRET, // Cloudinary API secret
})

// Cloudinary storage ayarlarını yapılandırın
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce', // Resimlerinizin yükleneceği klasör
    allowed_formats: ['jpeg', 'png'], // Yalnızca belirli formatlar kabul edilecek
    public_id: (req, file) => file.fieldname + '-' + Date.now(), // Dosya adı
  },
})

// Multer ayarları
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // Dosya boyut sınırı 5MB
  },
})

module.exports = upload
