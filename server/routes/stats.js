const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { overview, activity, mastery } = require('../controllers/statsController');

router.get('/overview', protect, overview);
router.get('/activity', protect, activity);
router.get('/mastery', protect, mastery);

module.exports = router;
