const express = require('express');
const { createOrder, getOrders, getOrderById, updateOrderStatus, trackOrder } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', createOrder);
router.get('/', protect, adminOnly, getOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);
router.get('/:id/track', trackOrder);

module.exports = router;
