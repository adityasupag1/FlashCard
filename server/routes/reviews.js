const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { gradeCard, startSession, finishSession } = require('../controllers/reviewController');

router.post('/grade', protect, gradeCard);
router.post('/session/start', protect, startSession);
router.post('/session/:id/finish', protect, finishSession);

module.exports = router;
