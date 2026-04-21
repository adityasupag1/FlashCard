const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  listCards,
  listDue,
  createCard,
  updateCard,
  deleteCard,
} = require('../controllers/cardController');

router.get('/deck/:deckId', protect, listCards);
router.get('/deck/:deckId/due', protect, listDue);
router.post('/', protect, createCard);
router.put('/:id', protect, updateCard);
router.delete('/:id', protect, deleteCard);

module.exports = router;
