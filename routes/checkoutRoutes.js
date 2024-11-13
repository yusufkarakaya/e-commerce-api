require('dotenv').config()
const express = require('express')
const router = express.Router()

router.post('/create-checkout-session', async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
  console.log('Stripe Secret Key:', process.env.STRIPE_SECRET_KEY)

  const { items } = req.body

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items provided' })
  }
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout/cancel`,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      billing_address_collection: 'required',
    })

    res.status(200).json({ url: session.url })
  } catch (error) {
    console.error('Stripe session error:', error)
    res.status(500).json({
      error: 'Failed to create checkout session',
      details: error.message,
    })
  }
})

router.get('/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    })
    res.status(200).json(session)
  } catch (error) {
    console.error('Error retrieving checkout session:', error)
    res.status(500).json({ error: 'Failed to retrieve checkout session' })
  }
})

module.exports = router
