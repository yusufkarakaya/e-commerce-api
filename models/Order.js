const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    guestId: {
      type: String,
      sparse: true,
    },
    guestInfo: {
      email: String,
      name: String,
      address: String,
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
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      type: Object,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'cancelled'],
      default: 'processing',
    },
    stripeSessionId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
)

// Ensure either user or guestId is present
orderSchema.pre('save', function (next) {
  if (!this.user && !this.guestId) {
    next(new Error('Order must have either a user or a guestId'))
  }
  next()
})

// Create indexes
orderSchema.index({ user: 1 })
orderSchema.index({ guestId: 1 })
orderSchema.index({ stripeSessionId: 1 })

module.exports = mongoose.model('Order', orderSchema)
