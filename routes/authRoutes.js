const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')

router.route('/login').post(userController.loginUser)
router.route('/register').post(userController.createUser)

router.route('/verify-user').post(userController.verifyUser)

module.exports = router
