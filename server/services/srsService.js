// SM-2 spaced repetition algorithm
// Quality mapping: Again=1, Hard=3, Good=4, Easy=5
// Returns updated card state { easeFactor, interval, repetitions, dueDate, status }

const GRADE = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

function applySM2(card, gradeName) {
  const q = GRADE[gradeName] ?? GRADE.good;

  let { easeFactor = 2.5, interval = 0, repetitions = 0, lapses = 0 } = card;

  if (q < 3) {
    // Failed — reset repetitions, show again soon
    repetitions = 0;
    interval = 0; // due immediately (within 10 min in practice)
    lapses += 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  // Update ease factor (SM-2 formula)
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Status progression
  let status = 'learning';
  if (repetitions === 0) status = 'learning';
  else if (interval >= 21 && repetitions >= 4) status = 'mastered';
  else if (repetitions === 0 && lapses === 0) status = 'new';

  // Compute next due date
  const dueDate = new Date();
  if (q < 3) {
    dueDate.setMinutes(dueDate.getMinutes() + 10); // see again in 10 min
  } else {
    dueDate.setDate(dueDate.getDate() + interval);
  }

  return {
    easeFactor: Number(easeFactor.toFixed(2)),
    interval,
    repetitions,
    lapses,
    dueDate,
    status,
    lastReviewedAt: new Date(),
  };
}

module.exports = { applySM2, GRADE };
