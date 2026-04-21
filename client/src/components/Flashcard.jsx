import { useState, useEffect } from 'react';

export default function Flashcard({ card, index, total, onFlip }) {
  const [flipped, setFlipped] = useState(false);

  // Reset on new card
  useEffect(() => {
    setFlipped(false);
  }, [card?._id]);

  const handleFlip = () => {
    setFlipped((f) => {
      const next = !f;
      onFlip && onFlip(next);
      return next;
    });
  };

  if (!card) return null;

  return (
    <div className="flashcard-container w-full max-w-2xl mx-auto" style={{ minHeight: 340 }}>
      <div
        className={`flashcard-inner relative w-full h-full ${flipped ? 'flashcard-flipped' : ''}`}
        style={{ minHeight: 340 }}
      >
        {/* Front */}
        <div
          onClick={handleFlip}
          className="flashcard-face absolute inset-0 bg-white rounded-2xl shadow-flashcard border-t-4 border-primary p-8 md:p-12 flex flex-col cursor-pointer select-none"
        >
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              {card.topic || 'Question'}
            </span>
            <span className="text-xs text-on-surface-variant">
              Card {index + 1} of {total}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <h4 className="font-bold text-xl md:text-2xl text-on-surface text-center leading-snug">
              {card.front}
            </h4>
          </div>
          {card.hint && (
            <details className="mt-4" onClick={(e) => e.stopPropagation()}>
              <summary className="text-xs text-on-surface-variant cursor-pointer hover:text-primary">
                Show hint
              </summary>
              <p className="text-sm text-on-surface-variant mt-2 italic">{card.hint}</p>
            </details>
          )}
          <div className="mt-6 flex justify-center">
            <button
              onClick={(e) => { e.stopPropagation(); handleFlip(); }}
              className="px-6 py-2.5 bg-primary-fixed text-on-primary-fixed rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-transform"
            >
              Flip card
            </button>
          </div>
        </div>

        {/* Back */}
        <div
          onClick={handleFlip}
          className="flashcard-face flashcard-back absolute inset-0 bg-white rounded-2xl shadow-flashcard border-t-4 border-tertiary p-8 md:p-12 flex flex-col cursor-pointer select-none"
        >
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs font-bold text-tertiary uppercase tracking-wider">Answer</span>
            <span className="text-xs text-on-surface-variant">
              Card {index + 1} of {total}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-auto">
            <p className="text-base md:text-lg text-on-surface text-center leading-relaxed whitespace-pre-wrap">
              {card.back}
            </p>
          </div>
          <p className="text-center text-xs text-outline mt-6">
            Click card or use buttons below to grade
          </p>
        </div>
      </div>
    </div>
  );
}
