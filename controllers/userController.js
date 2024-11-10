const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { sendVerificationEmail } = require('../services/emailService')
const crypto = require('crypto')

const loginUser = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Please fill all fields' })
  }

  try {
    const user = await User.findOne({ email: email }).lean()

    if (!user) {
      return res.status(404).json({ message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    const accessToken = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    )
    return res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      message: 'Login successful',
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().exec()

    if (!users.length) {
      return res.status(404).json({ message: 'No users found' })
    }
    return res.status(200).json(users)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const getUserById = async (req, res) => {
  const { id } = req.params

  try {
    const user = await User.findById(id).exec()

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    return res.status(200).json(user)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const createUser = async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' })
    }

    const existingUser = await User.findOne({ email }).lean().exec()
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const verificationCode = crypto.randomBytes(3).toString('hex')

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      verificationCode,
      isVerified: false,
    })

    await sendVerificationEmail(email, verificationCode)

    return res.status(201).json({ message: 'User created successfully', user })
  } catch (error) {
    console.error('Error occurred:', error)
    return res
      .status(500)
      .json({ message: 'Internal Server Error', error: error.message })
  }
}

const verifyUser = async (req, res) => {
  const { email, code } = req.body

  try {
    const user = await User.findOne({ email }).exec()

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' })
    }

    if (user.verificationCode === code) {
      user.isVerified = true
      user.verificationCode = undefined
      await user.save()
      return res.status(200).json({ message: 'Email verified successfully' })
    } else {
      return res.status(400).json({ message: 'Invalid verification code' })
    }
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const updateUser = async (req, res) => {
  const { id } = req.params
  const { username, email, password } = req.body

  if (!username || !email) {
    return res
      .status(400)
      .json({ message: 'Please provide all fields except password' })
  }

  try {
    const user = await User.findById(id).exec()
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.username = username
    user.email = email

    if (password) {
      user.password = await bcrypt.hash(password, 10)
    }
    const updateUser = await user.save()
    return res.status(200).json(updateUser)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const deleteUser = async (req, res) => {
  const { id } = req.params

  try {
    const user = await User.findById(id).exec()
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    await user.deleteOne()
    return res.status(200).json({ message: 'User deleted successfully' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  verifyUser,
}
