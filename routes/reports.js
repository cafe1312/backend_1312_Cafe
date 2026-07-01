const express = require('express');
const { getDashboardStats, getSalesReports } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, adminOnly, getDashboardStats);
router.get('/sales', protect, adminOnly, getSalesReports);

module.exports = router;
