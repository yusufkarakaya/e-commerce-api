const express = require('express')
const router = express.Router()
const path = require('path')

router.get('^/$|/index(.html)?', (req, res) => {
  if (req.path !== '/') {
    res.redirect('/')
  } else {
  }

  res.sendFile(path.join(__dirname, '..', 'views', 'index.html'))
})

module.exports = router
