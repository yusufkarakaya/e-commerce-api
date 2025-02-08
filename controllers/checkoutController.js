const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Cart = require('../models/Cart')
const Order = require('../models/Order')

const createCheckoutSession = async (req, res) => {
  try {
    const { items, guestInfo } = req.body
    const userId = req.user
    const guestId = req.guestId

    // Validate items
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid items data' })
    }

    // Create line items for Stripe
    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }))

    // Prepare metadata for the session
    const metadata = {
      userId: userId || 'guest',
      guestId: guestId || undefined,
      cartItems: JSON.stringify(items),
    }

    // Add guest info to metadata if provided
    if (guestInfo) {
      metadata.guestInfo = JSON.stringify(guestInfo)
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      metadata,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB'], // Add more countries as needed
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0,
              currency: 'usd',
            },
            display_name: 'Free shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 5,
              },
              maximum: {
                unit: 'business_day',
                value: 7,
              },
            },
          },
        },
      ],
    })

    res.json({ url: session.url })
  } catch (error) {
    console.error('Checkout session error:', error)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
}

const handleCheckoutSuccess = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id)
    const metadata = session.metadata
    const userId = metadata.userId !== 'guest' ? metadata.userId : null
    const guestId = metadata.guestId
    const cartItems = JSON.parse(metadata.cartItems)
    const guestInfo = metadata.guestInfo ? JSON.parse(metadata.guestInfo) : null

    // Create order
    const order = new Order({
      user: userId,
      guestId: guestId,
      guestInfo: guestInfo,
      products: cartItems.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: session.amount_total / 100,
      shippingAddress: session.shipping_details,
      paymentStatus: session.payment_status,
      stripeSessionId: session.id
    })

    await order.save()

    // Clear the cart
    if (userId || guestId) {
      await Cart.findOneAndUpdate(
        {
          $or: [
            { user: userId },
            { guestId: guestId }
          ]
        },
        { $set: { products: [] } }
      )
    }

    res.redirect(`${process.env.CLIENT_URL}/checkout/success`)
  } catch (error) {
    console.error('Checkout success handling error:', error)
    res.redirect(`${process.env.CLIENT_URL}/checkout/error`)
  }
}

module.exports = {
  createCheckoutSession,
  handleCheckoutSuccess
} 