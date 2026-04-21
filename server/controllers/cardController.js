const asyncHandler = require('express-async-handler');
const Card = require('../models/Card');
const Deck = require('../models/Deck');
const { refreshDeckCounts } = require('./deckController');

// GET /api/cards/deck/:deckId  — list all cards in a deck
const listCards = asyncHandler(async (req, res) => {
  const deck = await Deck.findById(req.params.deckId);
  if (!deck) {
    res.status(404);
    throw new Error('Deck not found');
  }
  if (deck.user.toString() !== req.user._id.toString() && !deck.isPublic) {
    res.status(403);
    throw new Error('Not allowed');
  }
  const cards = await Card.find({ deck: deck._id }).sort({ createdAt: 1 });
  res.json(cards);
});

// GET /api/cards/deck/:deckId/due  — cards due for review
const listDue = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 30;
  const deck = await Deck.findById(req.params.deckId);
  if (!deck) {
    res.status(404);
    throw new Error('Deck not found');
  }
  if (deck.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not allowed');
  }
  const cards = await Card.find({
    deck: deck._id,
    dueDate: { $lte: new Date() },
  })
    .sort({ dueDate: 1 })
    .limit(limit);
  res.json(cards);
});

// POST /api/cards  — create a single card
const createCard = asyncHandler(async (req, res) => {
  const { deckId, front, back, hint, topic } = req.body;
  if (!deckId || !front || !back) {
    res.status(400);
    throw new Error('deckId, front and back are required');
  }
  const deck = await Deck.findById(deckId);
  if (!deck || deck.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Deck not found');
  }
  const card = await Card.create({
    deck: deck._id,
    user: req.user._id,
    front,
    back,
    hint: hint || '',
    topic: topic || '',
    status: 'new',
    dueDate: new Date(),
  });
  await refreshDeckCounts(deck._id);
  res.status(201).json(card);
});

// PUT /api/cards/:id
const updateCard = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.id);
  if (!card) {
    res.status(404);
    throw new Error('Card not found');
  }
  if (card.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not allowed');
  }
  ['front', 'back', 'hint', 'topic'].forEach((k) => {
    if (req.body[k] !== undefined) card[k] = req.body[k];
  });
  await card.save();
  res.json(card);
});

// DELETE /api/cards/:id
const deleteCard = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.id);
  if (!card) {
    res.status(404);
    throw new Error('Card not found');
  }
  if (card.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not allowed');
  }
  const deckId = card.deck;
  await card.deleteOne();
  await refreshDeckCounts(deckId);
  res.json({ message: 'Card deleted' });
});

module.exports = { listCards, listDue, createCard, updateCard, deleteCard };
