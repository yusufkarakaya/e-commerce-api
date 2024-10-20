const User = require('../models/User')
const bcrypt = require('bcrypt')

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
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please provide all fields' })
  }

  try {
    const user = new User({
      username,
      email,
      password: await bcrypt.hash(password, 10),
      role: 'user',
    })

    await user.save()
    return res.status(201).json(user)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

const updateUser = async (req, res) => {
  const { id } = req.params
  const { username, email, password } = req.body

  //confirm data
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
}
