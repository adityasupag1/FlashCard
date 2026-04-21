const mongoose = require('mongoose');

const deckSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    subject: {
      type: String,
      enum: ['Math', 'Science', 'History', 'Medicine', 'Language', 'CS', 'Other'],
      default: 'Other',
    },
    sourceFileName: { type: String, default: '' },
    depth: { type: String, enum: ['quick', 'balanced', 'deep'], default: 'balanced' },
    cardType: { type: String, enum: ['qa', 'cloze', 'mixed'], default: 'qa' },
    isPinned: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    // Quick counts cached — updated whenever cards change
    cardCount: { type: Number, default: 0 },
    newCount: { type: Number, default: 0 },
    learningCount: { type: Number, default: 0 },
    masteredCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Deck', deckSchema);
