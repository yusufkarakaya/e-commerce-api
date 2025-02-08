const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true
    },
    guestId: {
      type: String,
      sparse: true
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
      },
    ],
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
)

// Ensure either user or guestId is present
cartSchema.pre('save', function (next) {
  if (!this.user && !this.guestId) {
    next(new Error('Cart must have either a user or guestId'))
  }
  this.lastActive = new Date()
  next()
})

cartSchema.index({ user: 1 })
cartSchema.index({ guestId: 1 })
cartSchema.index({ lastActive: 1 })

module.exports = mongoose.model('Cart', cartSchema)
