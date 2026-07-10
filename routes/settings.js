const express = require('express');
const { body } = require('express-validator');
const { getSettings, updateSettings, getDistance } = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

// Get settings - Public
router.get('/', getSettings);

// Calculate distance securely on the backend - Public
router.post(
  '/distance',
  [
    body('latitude')
      .notEmpty().withMessage('Latitude is required')
      .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be a valid float between -90 and 90'),
    body('longitude')
      .notEmpty().withMessage('Longitude is required')
      .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be a valid float between -180 and 180'),
    validateRequest
  ],
  getDistance
);

// Update settings - Admin only
router.put(
  '/',
  protect,
  adminOnly,
  [
    body('cafeName').optional().trim().isLength({ max: 100 }).withMessage('Cafe name must not exceed 100 characters'),
    body('phone').optional().trim().isLength({ max: 30 }).withMessage('Phone must not exceed 30 characters'),
    body('email').optional().trim().isEmail().withMessage('Please provide a valid email'),
    body('address').optional().trim().isLength({ max: 200 }).withMessage('Address must not exceed 200 characters'),
    body('deliveryCharges').optional().isFloat({ min: 0 }).withMessage('Delivery charges must be a non-negative number'),
    body('taxPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Tax percentage must be between 0 and 100'),
    body('shopLatitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Shop latitude must be a valid float between -90 and 90'),
    body('shopLongitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Shop longitude must be a valid float between -180 and 180'),
    body('deliveryRangeKm').optional().isFloat({ min: 0 }).withMessage('Delivery range must be a non-negative number'),
    body('deliveryChargePerKm').optional().isFloat({ min: 0 }).withMessage('Delivery charge per km must be a non-negative number'),
    body('signatureProductIds').optional().isArray().withMessage('Signature products must be an array of IDs'),
    body('popularCategoryIds').optional().isArray().withMessage('Popular categories must be an array of IDs'),
    body('heroImages').optional().isArray().withMessage('Hero images must be an array of URLs'),
    body('kotCustomization').optional().isObject().withMessage('KOT customization must be an object'),
    body('billCustomization').optional().isObject().withMessage('Bill customization must be an object'),
    validateRequest
  ],
  updateSettings
);

module.exports = router;
