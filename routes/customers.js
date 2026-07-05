const express = require('express');
const { getCustomers, getCustomerDetails, createOrVerifyCustomer, deleteCustomer } = require('../controllers/customerController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, adminOnly, getCustomers);
router.get('/:id', protect, adminOnly, getCustomerDetails);
router.delete('/:id', protect, adminOnly, deleteCustomer);
router.post('/', createOrVerifyCustomer);

module.exports = router;
