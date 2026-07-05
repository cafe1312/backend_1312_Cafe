const express = require('express');
const { getDashboardStats, getSalesReports, downloadWeeklyPDF } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, adminOnly, getDashboardStats);
router.get('/sales', protect, adminOnly, getSalesReports);
router.get('/weekly-pdf', protect, adminOnly, downloadWeeklyPDF);

module.exports = router;
