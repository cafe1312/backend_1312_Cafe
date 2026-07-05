const express = require('express');
const { createOrder, getOrders, getOrderById, updateOrderStatus, trackOrder, cancelOrder, deleteOrder, cleanupOrders } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', createOrder);
router.get('/', protect, adminOnly, getOrders);
router.delete('/cleanup', protect, adminOnly, cleanupOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);
router.get('/:id/track', trackOrder);
router.post('/:id/cancel', cancelOrder);
router.delete('/:id', protect, adminOnly, deleteOrder);

module.exports = router;
