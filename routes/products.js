const express = require('express');
const { body, param } = require('express-validator');
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

router.get('/', getProducts);

router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Product ID must be an integer'),
    validateRequest
  ],
  getProductById
);

router.post(
  '/',
  protect,
  adminOnly,
  [
    body('categoryId').isInt().withMessage('Category ID must be an integer'),
    body('name')
      .notEmpty().withMessage('Product name is required')
      .trim().isLength({ max: 100 }).withMessage('Product name must not exceed 100 characters'),
    body('description')
      .optional({ nullable: true, checkFalsy: true })
      .trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('image')
      .optional({ nullable: true, checkFalsy: true })
      .trim().isURL().withMessage('Image must be a valid URL')
      .isLength({ max: 500 }).withMessage('Image URL must not exceed 500 characters'),
    body('available')
      .optional().custom(val => val === true || val === false || val === 'true' || val === 'false').withMessage('Available must be a boolean or boolean-string'),
    body('isVeg')
      .optional().custom(val => val === true || val === false || val === 'true' || val === 'false').withMessage('isVeg must be a boolean or boolean-string'),
    validateRequest
  ],
  createProduct
);

router.put(
  '/:id',
  protect,
  adminOnly,
  [
    param('id').isInt().withMessage('Product ID must be an integer'),
    body('categoryId').optional().isInt().withMessage('Category ID must be an integer'),
    body('name')
      .optional().trim().isLength({ min: 1, max: 100 }).withMessage('Product name must be between 1 and 100 characters'),
    body('description')
      .optional({ nullable: true, checkFalsy: true })
      .trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('image')
      .optional({ nullable: true, checkFalsy: true })
      .trim().isURL().withMessage('Image must be a valid URL')
      .isLength({ max: 500 }).withMessage('Image URL must not exceed 500 characters'),
    body('available')
      .optional().custom(val => val === true || val === false || val === 'true' || val === 'false').withMessage('Available must be a boolean or boolean-string'),
    body('isVeg')
      .optional().custom(val => val === true || val === false || val === 'true' || val === 'false').withMessage('isVeg must be a boolean or boolean-string'),
    validateRequest
  ],
  updateProduct
);

router.delete(
  '/:id',
  protect,
  adminOnly,
  [
    param('id').isInt().withMessage('Product ID must be an integer'),
    validateRequest
  ],
  deleteProduct
);

module.exports = router;
