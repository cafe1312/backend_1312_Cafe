const express = require('express');
const { body, param } = require('express-validator');
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

router.get('/', getCategories);

router.post(
  '/',
  protect,
  adminOnly,
  [
    body('name')
      .notEmpty().withMessage('Category name is required')
      .trim().isLength({ max: 50 }).withMessage('Category name must not exceed 50 characters'),
    body('image')
      .optional({ nullable: true, checkFalsy: true })
      .trim().isURL().withMessage('Image must be a valid URL')
      .isLength({ max: 500 }).withMessage('Image URL must not exceed 500 characters'),
    body('availableFrom')
      .optional({ nullable: true, checkFalsy: true })
      .trim().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('availableFrom must be in HH:MM format'),
    body('availableTo')
      .optional({ nullable: true, checkFalsy: true })
      .trim().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('availableTo must be in HH:MM format'),
    validateRequest
  ],
  createCategory
);

router.put(
  '/:id',
  protect,
  adminOnly,
  [
    param('id').isInt().withMessage('Category ID must be an integer'),
    body('name')
      .optional().trim().isLength({ min: 1, max: 50 }).withMessage('Category name must be between 1 and 50 characters'),
    body('image')
      .optional({ nullable: true, checkFalsy: true })
      .trim().isURL().withMessage('Image must be a valid URL')
      .isLength({ max: 500 }).withMessage('Image URL must not exceed 500 characters'),
    body('availableFrom')
      .optional({ nullable: true, checkFalsy: true })
      .trim().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('availableFrom must be in HH:MM format'),
    body('availableTo')
      .optional({ nullable: true, checkFalsy: true })
      .trim().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('availableTo must be in HH:MM format'),
    validateRequest
  ],
  updateCategory
);

router.delete(
  '/:id',
  protect,
  adminOnly,
  [
    param('id').isInt().withMessage('Category ID must be an integer'),
    validateRequest
  ],
  deleteCategory
);

module.exports = router;
