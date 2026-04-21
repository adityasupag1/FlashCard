const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    deck: { type: mongoose.Schema.Types.ObjectId, ref: 'Deck', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    front: { type: String, required: true },
    back: { type: String, required: true },
    hint: { type: String, default: '' },
    topic: { type: String, default: '' }, // e.g. "Cell Biology" chip on the card
    // SM-2 spaced repetition state
    status: {
      type: String,
      enum: ['new', 'learning', 'mastered'],
      default: 'new',
      index: true,
    },
    easeFactor: { type: Number, default: 2.5 }, // EF in SM-2
    interval: { type: Number, default: 0 }, // days until next review
    repetitions: { type: Number, default: 0 },
    dueDate: { type: Date, default: () => new Date(), index: true },
    lapses: { type: Number, default: 0 },
    lastReviewedAt: { type: Date },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Card', cardSchema);
