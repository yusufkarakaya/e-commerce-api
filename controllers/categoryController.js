const Category = require('../models/Category')

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find()

    if (!categories.length) {
      return res.status(404).json({ message: 'No categories found' })
    }

    return res.status(200).json(categories)
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Server error, please try again later' })
  }
}

const getCategoryById = async (req, res) => {
  const { id } = req.params

  try {
    const category = await Category.findById(id).exec()
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }
    return res.status(200).json(category)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' })
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name })
    if (existingCategory) {
      return res.status(409).json({ message: 'Category already exists' })
    }

    const category = await Category.create({ name })
    res.status(201).json(category)
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Unable to create category, please try again later' })
  }
}

// Update a category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' })
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    )

    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }

    res.status(200).json(category)
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Unable to update category, please try again later' })
  }
}

// Delete a category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params

    const category = await Category.findByIdAndDelete(id)

    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }

    res.status(200).json({ message: 'Category deleted successfully' })
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Unable to delete category, please try again later' })
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
}
