const prisma = require('../config/db');

// Get all categories
async function getCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    next(error);
  }
}

// Create category
async function createCategory(req, res, next) {
  try {
    const { name, image } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const existingCategory = await prisma.category.findUnique({ where: { name } });
    if (existingCategory) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await prisma.category.create({
      data: { name, image }
    });

    res.status(201).json({ success: true, message: 'Category created successfully', category });
  } catch (error) {
    next(error);
  }
}

// Delete category
async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    await prisma.category.delete({
      where: { id: categoryId }
    });

    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCategories,
  createCategory,
  deleteCategory,
};
