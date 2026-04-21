const asyncHandler = require('express-async-handler');
const Card = require('../models/Card');
const Deck = require('../models/Deck');
const Session = require('../models/Session');
const User = require('../models/User');

// GET /api/stats/overview
const overview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [deckCount, cardCount, masteredCount, learningCount, newCount, dueToday] = await Promise.all([
    Deck.countDocuments({ user: userId }),
    Card.countDocuments({ user: userId }),
    Card.countDocuments({ user: userId, status: 'mastered' }),
    Card.countDocuments({ user: userId, status: 'learning' }),
    Card.countDocuments({ user: userId, status: 'new' }),
    Card.countDocuments({ user: userId, dueDate: { $lte: new Date() } }),
  ]);
  const user = await User.findById(userId);
  res.json({
    deckCount,
    cardCount,
    masteredCount,
    learningCount,
    newCount,
    dueToday,
    streak: user.streak || 0,
    lastStudiedOn: user.lastStudiedOn,
  });
});

// GET /api/stats/activity  — last 30 days study activity
const activity = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  const sessions = await Session.find({
    user: userId,
    startedAt: { $gte: start },
  }).sort({ startedAt: 1 });

  // Build 30-day array
  const days = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push({
      date: d.toISOString().slice(0, 10),
      reviews: 0,
      correct: 0,
      minutes: 0,
    });
  }
  sessions.forEach((s) => {
    const key = new Date(s.startedAt).toISOString().slice(0, 10);
    const day = days.find((d) => d.date === key);
    if (!day) return;
    day.reviews += s.cardsReviewed || 0;
    day.correct += s.correctCount || 0;
    day.minutes += Math.round((s.durationSeconds || 0) / 60);
  });

  // Subject distribution
  const decks = await Deck.find({ user: userId });
  const subjectCounts = {};
  decks.forEach((d) => {
    subjectCounts[d.subject] = (subjectCounts[d.subject] || 0) + (d.cardCount || 0);
  });
  const subjectDistribution = Object.entries(subjectCounts).map(([subject, count]) => ({ subject, count }));

  res.json({ days, subjectDistribution });
});

// GET /api/stats/mastery  — mastery progress over time (cumulative)
const mastery = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const cards = await Card.find({ user: userId, status: 'mastered' }).sort({ lastReviewedAt: 1 });
  const timeline = {};
  cards.forEach((c) => {
    const key = (c.lastReviewedAt || c.updatedAt).toISOString().slice(0, 10);
    timeline[key] = (timeline[key] || 0) + 1;
  });
  const series = Object.entries(timeline).map(([date, count]) => ({ date, count }));
  res.json(series);
});

module.exports = { overview, activity, mastery };
