const asyncHandler = require('express-async-handler');
const fs = require('fs');
const Deck = require('../models/Deck');
const Card = require('../models/Card');
const { extractPdfText } = require('../services/pdfService');
const { generateCardsFromText } = require('../services/aiService');

async function refreshDeckCounts(deckId) {
  const [total, newC, learningC, mastered] = await Promise.all([
    Card.countDocuments({ deck: deckId }),
    Card.countDocuments({ deck: deckId, status: 'new' }),
    Card.countDocuments({ deck: deckId, status: 'learning' }),
    Card.countDocuments({ deck: deckId, status: 'mastered' }),
  ]);
  await Deck.findByIdAndUpdate(deckId, {
    cardCount: total,
    newCount: newC,
    learningCount: learningC,
    masteredCount: mastered,
  });
}

// GET /api/decks
const listDecks = asyncHandler(async (req, res) => {
  const { q, subject } = req.query;
  const filter = { user: req.user._id };
  if (subject && subject !== 'All') filter.subject = subject;
  if (q) filter.title = { $regex: q, $options: 'i' };
  const decks = await Deck.find(filter).sort({ isPinned: -1, updatedAt: -1 });

  // For each deck, compute cards due today
  const decksWithDue = await Promise.all(
    decks.map(async (d) => {
      const dueCount = await Card.countDocuments({
        deck: d._id,
        dueDate: { $lte: new Date() },
      });
      return { ...d.toObject(), dueCount };
    })
  );
  res.json(decksWithDue);
});

// GET /api/decks/public  — "Explore" page
const listPublic = asyncHandler(async (req, res) => {
  const decks = await Deck.find({ isPublic: true })
    .populate('user', 'name avatar')
    .sort({ updatedAt: -1 })
    .limit(40);
  res.json(decks);
});

// GET /api/decks/:id
const getDeck = asyncHandler(async (req, res) => {
  const deck = await Deck.findById(req.params.id);
  if (!deck) {
    res.status(404);
    throw new Error('Deck not found');
  }
  if (deck.user.toString() !== req.user._id.toString() && !deck.isPublic) {
    res.status(403);
    throw new Error('Not allowed');
  }
  const cards = await Card.find({ deck: deck._id }).sort({ createdAt: 1 });
  const dueCount = await Card.countDocuments({ deck: deck._id, dueDate: { $lte: new Date() } });
  res.json({ deck, cards, dueCount });
});

// POST /api/decks  — create blank deck
const createDeck = asyncHandler(async (req, res) => {
  const { title, subject, depth, cardType, description } = req.body;
  if (!title) {
    res.status(400);
    throw new Error('Title is required');
  }
  const deck = await Deck.create({
    user: req.user._id,
    title,
    subject: subject || 'Other',
    depth: depth || 'balanced',
    cardType: cardType || 'qa',
    description: description || '',
  });
  res.status(201).json(deck);
});

// POST /api/decks/generate  — upload PDF + AI-generate a deck
// multipart/form-data: file, title, subject, depth, cardType
const generateDeck = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400);
    throw new Error('PDF file is required');
  }
  const { title, subject = 'Other', depth = 'balanced', cardType = 'qa' } = req.body;
  if (!title) {
    fs.unlink(file.path, () => {});
    res.status(400);
    throw new Error('Title is required');
  }

  let parsed;
  try {
    parsed = await extractPdfText(file.path);
  } catch (err) {
    fs.unlink(file.path, () => {});
    res.status(422);
    throw new Error('Could not parse this PDF. It may be scanned or encrypted.');
  }

  if (!parsed.text || parsed.text.length < 100) {
    fs.unlink(file.path, () => {});
    res.status(422);
    throw new Error('PDF contains too little text to generate cards from.');
  }

  let generated = [];
  try {
    generated = await generateCardsFromText(parsed.text, depth);
  } catch (err) {
    console.error('AI generation error:', err.message);
  } finally {
    // Always clean up the uploaded file — we don't keep PDFs
    fs.unlink(file.path, () => {});
  }

  if (!generated.length) {
    res.status(502);
    throw new Error('AI could not generate cards. Check your API key and try again.');
  }

  const deck = await Deck.create({
    user: req.user._id,
    title,
    subject,
    depth,
    cardType,
    sourceFileName: file.originalname,
  });

  const cardDocs = generated.map((c) => ({
    deck: deck._id,
    user: req.user._id,
    front: c.front,
    back: c.back,
    hint: c.hint || '',
    topic: c.topic || '',
    status: 'new',
    dueDate: new Date(),
  }));
  await Card.insertMany(cardDocs);
  await refreshDeckCounts(deck._id);

  const fresh = await Deck.findById(deck._id);
  res.status(201).json({ deck: fresh, cardsGenerated: cardDocs.length });
});

// PUT /api/decks/:id
const updateDeck = asyncHandler(async (req, res) => {
  const deck = await Deck.findById(req.params.id);
  if (!deck) {
    res.status(404);
    throw new Error('Deck not found');
  }
  if (deck.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not allowed');
  }
  const allowed = ['title', 'subject', 'description', 'depth', 'cardType', 'isPinned', 'isPublic'];
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) deck[k] = req.body[k];
  });
  await deck.save();
  res.json(deck);
});

// DELETE /api/decks/:id
const deleteDeck = asyncHandler(async (req, res) => {
  const deck = await Deck.findById(req.params.id);
  if (!deck) {
    res.status(404);
    throw new Error('Deck not found');
  }
  if (deck.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not allowed');
  }
  await Card.deleteMany({ deck: deck._id });
  await deck.deleteOne();
  res.json({ message: 'Deck deleted' });
});

module.exports = {
  listDecks,
  listPublic,
  getDeck,
  createDeck,
  generateDeck,
  updateDeck,
  deleteDeck,
  refreshDeckCounts,
};
