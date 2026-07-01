const express = require('express');
const { body } = require('express-validator');
const { adminLogin, adminRegister, customerAuth, refreshToken } = require('../controllers/authController');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

router.post(
  '/admin/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest
  ],
  adminLogin
);

router.post(
  '/admin/register',
  [
    body('username').isLength({ min: 4 }).withMessage('Username must be at least 4 characters long'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    validateRequest
  ],
  adminRegister
);

router.post(
  '/customer',
  [
    body('phone').notEmpty().withMessage('Phone number is required'),
    validateRequest
  ],
  customerAuth
);

router.post(
  '/refresh',
  [
    body('token').notEmpty().withMessage('Refresh token is required'),
    validateRequest
  ],
  refreshToken
);

module.exports = router;
