const prisma = require('../config/db');
const { clearProductsCache } = require('./productController');

let categoriesCache = null;

function clearCategoriesCache() {
  categoriesCache = null;
}

// Get all categories
async function getCategories(req, res, next) {
  try {
    if (categoriesCache) {
      return res.status(200).json({ success: true, categories: categoriesCache });
    }

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    categoriesCache = categories;
    res.status(200).json({ success: true, categories });
  } catch (error) {
    next(error);
  }
}

// Create category
async function createCategory(req, res, next) {
  try {
    const { name, image, availableFrom, availableTo } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const existingCategory = await prisma.category.findUnique({ where: { name } });
    if (existingCategory) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await prisma.category.create({
      data: { name, image, availableFrom, availableTo }
    });

    clearCategoriesCache();
    res.status(201).json({ success: true, message: 'Category created successfully', category });
  } catch (error) {
    next(error);
  }
}

// Update category (Admin only)
async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id);
    const { name, image, availableFrom, availableTo } = req.body;

    if (isNaN(categoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    if (name) {
      const existing = await prisma.category.findUnique({ where: { name } });
      if (existing && existing.id !== categoryId) {
        return res.status(400).json({ success: false, message: 'Category name already exists' });
      }
    }

    let updateData = {};
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image;
    if (availableFrom !== undefined) updateData.availableFrom = availableFrom;
    if (availableTo !== undefined) updateData.availableTo = availableTo;

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: updateData
    });

    clearCategoriesCache();
    clearProductsCache();

    res.status(200).json({ success: true, message: 'Category updated successfully', category });
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

    clearCategoriesCache();
    clearProductsCache();

    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
