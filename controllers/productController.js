const prisma = require('../config/db');

let productsCache = null;

function clearProductsCache() {
  productsCache = null;
}

// Get all products with filters
async function getProducts(req, res, next) {
  try {
    const { categoryId, search, available, isVeg } = req.query;
    
    if (!productsCache) {
      productsCache = await prisma.product.findMany({
        include: {
          category: {
            select: { name: true, availableFrom: true, availableTo: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    let filtered = productsCache;

    if (categoryId) {
      const parsedCatId = parseInt(categoryId);
      filtered = filtered.filter(p => p.categoryId === parsedCatId);
    }
    
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.description && p.description.toLowerCase().includes(query))
      );
    }

    if (available !== undefined) {
      const isAvailable = available === 'true';
      filtered = filtered.filter(p => p.available === isAvailable);
    }

    if (isVeg !== undefined) {
      const isVegBool = isVeg === 'true' || isVeg === true;
      filtered = filtered.filter(p => p.isVeg === isVegBool);
    }

    res.status(200).json({ success: true, products: filtered });
  } catch (error) {
    next(error);
  }
}

// Get single product details
async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          select: { name: true, availableFrom: true, availableTo: true }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
}

// Create new product
async function createProduct(req, res, next) {
  try {
    const { categoryId, name, description, price, image, available, isVeg } = req.body;

    if (!categoryId || !name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Category, name, and price are required' });
    }

    const parsedCategoryId = parseInt(categoryId);
    const parsedPrice = parseFloat(price);

    const product = await prisma.product.create({
      data: {
        categoryId: parsedCategoryId,
        name,
        description,
        price: parsedPrice,
        image,
        available: available === undefined ? true : available === 'true' || available === true,
        isVeg: isVeg === undefined ? true : isVeg === 'true' || isVeg === true,
      },
      include: {
        category: {
          select: { name: true, availableFrom: true, availableTo: true }
        }
      }
    });

    clearProductsCache();
    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error) {
    next(error);
  }
}

// Update existing product
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const { categoryId, name, description, price, image, available, isVeg } = req.body;

    let updateData = {};
    if (categoryId !== undefined) updateData.categoryId = parseInt(categoryId);
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (image !== undefined) updateData.image = image;
    if (available !== undefined) updateData.available = available === 'true' || available === true;
    if (isVeg !== undefined) updateData.isVeg = isVeg === 'true' || isVeg === true;

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: {
          select: { name: true, availableFrom: true, availableTo: true }
        }
      }
    });

    clearProductsCache();
    res.status(200).json({ success: true, message: 'Product updated successfully', product });
  } catch (error) {
    next(error);
  }
}

// Delete product
async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    await prisma.product.delete({
      where: { id: productId }
    });

    clearProductsCache();
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  clearProductsCache,
};
