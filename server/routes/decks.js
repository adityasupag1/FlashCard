const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  listDecks,
  listPublic,
  getDeck,
  createDeck,
  generateDeck,
  updateDeck,
  deleteDeck,
} = require('../controllers/deckController');

router.get('/public', listPublic); // Explore page — no auth required
router.get('/', protect, listDecks);
router.post('/', protect, createDeck);
router.post('/generate', protect, upload.single('file'), generateDeck);
router.get('/:id', protect, getDeck);
router.put('/:id', protect, updateDeck);
router.delete('/:id', protect, deleteDeck);

module.exports = router;
