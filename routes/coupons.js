const express = require('express');
const { body, param } = require('express-validator');
const { getCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon } = require('../controllers/couponController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

router.get('/', protect, adminOnly, getCoupons);

router.post(
  '/',
  protect,
  adminOnly,
  [
    body('code')
      .notEmpty().withMessage('Coupon code is required')
      .trim().isAlphanumeric().withMessage('Coupon code must contain only letters and numbers')
      .isLength({ min: 3, max: 20 }).withMessage('Coupon code must be between 3 and 20 characters'),
    body('discount')
      .notEmpty().withMessage('Discount is required')
      .isFloat({ min: 0, max: 100 }).withMessage('Discount must be a number between 0 and 100'),
    body('active')
      .optional().isBoolean().withMessage('Active must be a boolean'),
    validateRequest
  ],
  createCoupon
);

router.put(
  '/:id',
  protect,
  adminOnly,
  [
    param('id').isInt().withMessage('Coupon ID must be an integer'),
    body('discount')
      .optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be a number between 0 and 100'),
    body('active')
      .optional().isBoolean().withMessage('Active must be a boolean'),
    validateRequest
  ],
  updateCoupon
);

router.delete(
  '/:id',
  protect,
  adminOnly,
  [
    param('id').isInt().withMessage('Coupon ID must be an integer'),
    validateRequest
  ],
  deleteCoupon
);

router.post(
  '/validate',
  [
    body('code')
      .notEmpty().withMessage('Coupon code is required')
      .trim().isAlphanumeric().withMessage('Coupon code must contain only letters and numbers')
      .isLength({ min: 3, max: 20 }).withMessage('Coupon code must be between 3 and 20 characters'),
    validateRequest
  ],
  validateCoupon
);

module.exports = router;
