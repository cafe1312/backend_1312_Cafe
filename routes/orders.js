const express = require('express');
const { body, param, query } = require('express-validator');
const { createOrder, getOrders, getOrderById, updateOrderStatus, trackOrder, cancelOrder, deleteOrder, cleanupOrders } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

router.post(
  '/',
  [
    body('phone')
      .notEmpty().withMessage('Phone number is required')
      .trim().isLength({ min: 5, max: 20 }).withMessage('Phone number must be between 5 and 20 characters'),
    body('name')
      .optional({ nullable: true, checkFalsy: true })
      .trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('address')
      .optional({ nullable: true, checkFalsy: true })
      .trim().isLength({ max: 200 }).withMessage('Address must not exceed 200 characters'),
    body('paymentMethod')
      .notEmpty().withMessage('Payment method is required')
      .trim().isIn(['CASH', 'CARD', 'UPI', 'cash', 'card', 'upi']).withMessage('Invalid payment method'),
    body('deliveryMethod')
      .optional()
      .trim().isIn(['TAKEAWAY', 'DELIVERY', 'takeaway', 'delivery']).withMessage('Invalid delivery method'),
    body('couponCode')
      .optional({ nullable: true, checkFalsy: true })
      .trim().isAlphanumeric().isLength({ max: 20 }),
    body('latitude')
      .optional({ nullable: true })
      .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be a valid float between -90 and 90'),
    body('longitude')
      .optional({ nullable: true })
      .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be a valid float between -180 and 180'),
    body('items')
      .isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    body('items.*.productId')
      .isInt().withMessage('Product ID in items must be an integer'),
    body('items.*.quantity')
      .isInt({ min: 1 }).withMessage('Quantity in items must be at least 1'),
    validateRequest
  ],
  createOrder
);

router.get(
  '/',
  protect,
  adminOnly,
  [
    query('status').optional().trim().isIn(['ALL', 'PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validateRequest
  ],
  getOrders
);

router.delete('/cleanup', protect, adminOnly, cleanupOrders);

router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Order ID must be an integer'),
    validateRequest
  ],
  getOrderById
);

router.put(
  '/:id/status',
  protect,
  adminOnly,
  [
    param('id').isInt().withMessage('Order ID must be an integer'),
    body('status')
      .notEmpty().withMessage('Status is required')
      .trim().isIn(['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status value'),
    validateRequest
  ],
  updateOrderStatus
);

router.get(
  '/:id/track',
  [
    param('id').isInt().withMessage('Order ID must be an integer'),
    validateRequest
  ],
  trackOrder
);

router.post(
  '/:id/cancel',
  [
    param('id').isInt().withMessage('Order ID must be an integer'),
    validateRequest
  ],
  cancelOrder
);

router.delete(
  '/:id',
  protect,
  adminOnly,
  [
    param('id').isInt().withMessage('Order ID must be an integer'),
    validateRequest
  ],
  deleteOrder
);

module.exports = router;
