const express = require('express');
const { body, param } = require('express-validator');
const { getCustomers, getCustomerDetails, createOrVerifyCustomer, deleteCustomer } = require('../controllers/customerController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

router.get('/', protect, adminOnly, getCustomers);

router.get(
  '/:id',
  protect,
  adminOnly,
  [
    param('id').isInt().withMessage('Customer ID must be an integer'),
    validateRequest
  ],
  getCustomerDetails
);

router.delete(
  '/:id',
  protect,
  adminOnly,
  [
    param('id').isInt().withMessage('Customer ID must be an integer'),
    validateRequest
  ],
  deleteCustomer
);

router.post(
  '/',
  [
    body('name')
      .notEmpty().withMessage('Name is required')
      .trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('phone')
      .notEmpty().withMessage('Phone is required')
      .trim().isLength({ min: 5, max: 15 }).withMessage('Phone must be between 5 and 15 characters'),
    body('address')
      .optional({ nullable: true, checkFalsy: true })
      .trim().isLength({ max: 200 }).withMessage('Address must not exceed 200 characters'),
    validateRequest
  ],
  createOrVerifyCustomer
);

module.exports = router;
