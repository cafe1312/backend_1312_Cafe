const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getSettings);
router.put('/', protect, adminOnly, updateSettings);

module.exports = router;
