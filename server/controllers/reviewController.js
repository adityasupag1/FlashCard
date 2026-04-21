const asyncHandler = require('express-async-handler');
const Card = require('../models/Card');
const Deck = require('../models/Deck');
const Session = require('../models/Session');
const User = require('../models/User');
const { applySM2 } = require('../services/srsService');
const { refreshDeckCounts } = require('./deckController');

// POST /api/reviews/grade
// body: { cardId, grade: 'again' | 'hard' | 'good' | 'easy', sessionId? }
const gradeCard = asyncHandler(async (req, res) => {
  const { cardId, grade, sessionId } = req.body;
  if (!cardId || !grade) {
    res.status(400);
    throw new Error('cardId and grade are required');
  }
  const card = await Card.findById(cardId);
  if (!card) {
    res.status(404);
    throw new Error('Card not found');
  }
  if (card.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not allowed');
  }

  const update = applySM2(card, grade);
  Object.assign(card, update);
  card.totalReviews = (card.totalReviews || 0) + 1;
  await card.save();

  // Update session stats if one is passed
  if (sessionId) {
    const session = await Session.findById(sessionId);
    if (session && session.user.toString() === req.user._id.toString()) {
      session.cardsReviewed += 1;
      if (grade === 'again') { session.againCount += 1; session.incorrectCount += 1; }
      else if (grade === 'hard') { session.correctCount += 1; }
      else if (grade === 'good') { session.goodCount += 1; session.correctCount += 1; }
      else if (grade === 'easy') { session.easyCount += 1; session.correctCount += 1; }
      await session.save();
    }
  }

  await refreshDeckCounts(card.deck);
  res.json({ card });
});

// POST /api/reviews/session/start
const startSession = asyncHandler(async (req, res) => {
  const { deckId } = req.body;
  const deck = await Deck.findById(deckId);
  if (!deck || deck.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Deck not found');
  }
  const session = await Session.create({ user: req.user._id, deck: deck._id });
  res.status(201).json(session);
});

// POST /api/reviews/session/:id/finish
const finishSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session || session.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Session not found');
  }
  session.finishedAt = new Date();
  session.durationSeconds = Math.round((session.finishedAt - session.startedAt) / 1000);
  await session.save();

  // Update user streak
  const user = await User.findById(req.user._id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = user.lastStudiedOn ? new Date(user.lastStudiedOn) : null;
  if (last) last.setHours(0, 0, 0, 0);

  if (!last || today.getTime() !== last.getTime()) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (last && last.getTime() === yesterday.getTime()) {
      user.streak = (user.streak || 0) + 1;
    } else {
      user.streak = 1;
    }
    user.lastStudiedOn = new Date();
    await user.save();
  }

  res.json({ session, streak: user.streak });
});

module.exports = { gradeCard, startSession, finishSession };
