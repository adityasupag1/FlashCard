const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deck: { type: mongoose.Schema.Types.ObjectId, ref: 'Deck', required: true, index: true },
    cardsReviewed: { type: Number, default: 0 },
    currentCardIndex: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    againCount: { type: Number, default: 0 },
    hardCount: { type: Number, default: 0 },
    goodCount: { type: Number, default: 0 },
    easyCount: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
