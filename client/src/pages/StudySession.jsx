import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import Flashcard from '../components/Flashcard';
import toast from 'react-hot-toast';

function getMilestoneMessage(reviews) {
  if (!reviews) return '';
  if (reviews % 25 === 0) return `Streaking! ${reviews} cards reviewed this session.`;
  if (reviews % 10 === 0) return `Nice momentum: ${reviews} cards done.`;
  return '';
}

export default function StudySession() {
  const { deckId } = useParams();
  const nav = useNavigate();

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [session, setSession] = useState(null);
  const [showGrades, setShowGrades] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [progressCount, setProgressCount] = useState(0); // how many cards are already graded in this session
  const [masteryPop, setMasteryPop] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [deckRes, sessionRes] = await Promise.all([
          api.get(`/decks/${deckId}`),
          api.post('/reviews/session/start', { deckId }),
        ]);
        setDeck(deckRes.data.deck);
        // Resume against the full deck card list so position remains stable (e.g. 4/40).
        const studyCards = deckRes.data.cards || [];
        const resumedSession = sessionRes.data;
        const resumeFrom = resumedSession?.currentCardIndex ?? resumedSession?.cardsReviewed ?? 0;
        const resumeIndex = Math.max(0, Math.min(resumeFrom, Math.max(studyCards.length - 1, 0)));
        setCards(studyCards);
        setSession(resumedSession);
        setIdx(resumeIndex);
        setProgressCount(resumedSession?.cardsReviewed || 0);
        setStats({
          again: resumedSession?.againCount || 0,
          hard: resumedSession?.hardCount || 0,
          good: resumedSession?.goodCount || 0,
          easy: resumedSession?.easyCount || 0,
        });
      } catch (err) {
        toast.error('Could not start session');
        nav('/decks');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  const finishSession = useCallback(async () => {
    if (!session) return nav('/decks');
    try {
      const { data } = await api.post(`/reviews/session/${session._id}/finish`);
      nav(`/session/${session._id}/complete`, {
        state: { session: data.session, streak: data.streak, deck, stats },
      });
    } catch {
      nav('/decks');
    }
  }, [session, nav, deck, stats]);

  const pauseSession = useCallback(() => {
    // Do not finish the session here; keep it open for exact resume.
    nav('/decks');
  }, [nav]);

  const grade = async (g) => {
    if (submitting || !cards[idx]) return;
    if (!session?._id) {
      toast.error('Session is still initializing. Please try again in a moment.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/reviews/grade', {
        cardId: cards[idx]._id,
        grade: g,
        sessionId: session?._id,
      });
      setStats((s) => ({ ...s, [g]: s[g] + 1 }));
      let nextProgressCount = 0;
      setProgressCount((n) => {
        nextProgressCount = n + 1;
        return nextProgressCount;
      });
      const milestone = getMilestoneMessage((progressCount || 0) + 1);
      if (milestone) toast.success(milestone, { icon: '🔥' });
      if (data?.card?.status === 'mastered') {
        setMasteryPop(data.card.topic || data.card.front || 'Card');
        toast.success('Mastery unlocked!', { icon: '🏆' });
        setTimeout(() => setMasteryPop(''), 2200);
      }
      setShowGrades(false);
      if (idx + 1 >= cards.length) {
        await finishSession();
      } else {
        setIdx((i) => i + 1);
      }
    } catch {
      toast.error('Could not save grade');
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard shortcuts: space=flip, 1234 = again/hard/good/easy
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setShowGrades(true);
      } else if (showGrades) {
        if (e.key === '1') grade('again');
        else if (e.key === '2') grade('hard');
        else if (e.key === '3') grade('good');
        else if (e.key === '4') grade('easy');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGrades, idx, cards, submitting]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-on-surface-variant">Loading session…</div>;
  }

  if (!cards.length) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-12 text-center max-w-md shadow-card border border-border-subtle">
          <span className="material-symbols-outlined text-6xl text-tertiary mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>
            celebration
          </span>
          <h2 className="text-h3-card text-on-surface mb-2">Nothing to review!</h2>
          <p className="text-on-surface-variant mb-6">This deck has no cards yet. Add some to start studying.</p>
          <Link
            to={`/decks/${deckId}`}
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-bold hover:scale-105 transition-transform"
          >
            Back to deck
          </Link>
        </div>
      </div>
    );
  }

  const current = cards[idx];
  const isReviewingPrevious = idx < progressCount;
  const progressPct = Math.round(((idx) / cards.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-blue via-surface to-surface flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-border-subtle px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <button
          onClick={() => {
            if (confirm('Pause session and resume later from the same card?')) pauseSession();
          }}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined">close</span>
          <span className="text-sm font-medium hidden md:inline">Pause session</span>
        </button>
        <div className="flex items-center gap-4 flex-1 max-w-md mx-6">
          <span className="text-xs font-bold text-on-surface-variant">{idx + 1}/{cards.length}</span>
          <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <div className="hidden md:flex gap-2 text-xs">
          <span className="px-2 py-1 bg-bg-red text-accent-red rounded font-bold">{stats.again}</span>
          <span className="px-2 py-1 bg-bg-yellow text-secondary rounded font-bold">{stats.hard}</span>
          <span className="px-2 py-1 bg-bg-blue text-primary rounded font-bold">{stats.good}</span>
          <span className="px-2 py-1 bg-bg-green text-tertiary rounded font-bold">{stats.easy}</span>
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
        <div className="mb-2 text-xs text-on-surface-variant font-medium">{deck?.title}</div>
        {masteryPop && (
          <div className="mb-3 text-xs font-bold text-tertiary bg-bg-green px-3 py-1 rounded-full animate-reveal-up">
            Mastered: {String(masteryPop).slice(0, 60)}
          </div>
        )}
        {isReviewingPrevious && (
          <div className="mb-3 text-xs font-semibold text-secondary bg-bg-yellow px-3 py-1 rounded-full">
            Reviewing previous card (read-only)
          </div>
        )}
        <Flashcard
          card={current}
          index={idx}
          total={cards.length}
          onFlip={(flipped) => setShowGrades(flipped)}
        />

        {/* Grade buttons */}
        <div className="w-full max-w-2xl mt-8">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => {
                if (idx === 0) return;
                setIdx((i) => i - 1);
                setShowGrades(false);
              }}
              disabled={idx === 0 || submitting}
              className="px-4 py-2 rounded-lg border border-border-subtle bg-white text-on-surface-variant font-semibold disabled:opacity-50"
            >
              Previous
            </button>
            {isReviewingPrevious && (
              <button
                onClick={() => {
                  setIdx(Math.min(progressCount, cards.length - 1));
                  setShowGrades(false);
                }}
                className="px-4 py-2 rounded-lg border border-primary text-primary bg-bg-blue font-semibold"
              >
                Back to current
              </button>
            )}
          </div>
          {!showGrades ? (
            <button
              onClick={() => setShowGrades(true)}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Show answer <span className="text-white/60 text-xs ml-2 hidden md:inline">(Space)</span>
            </button>
          ) : isReviewingPrevious ? (
            <div className="w-full py-4 bg-white border border-border-subtle rounded-xl text-center text-sm text-on-surface-variant font-medium">
              This card is already graded. Go back to current card to submit a new grade.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 md:gap-3 animate-slide-up">
              <GradeButton
                className="bg-bg-red border-accent-red text-accent-red"
                label="Again" shortcut="1"
                onClick={() => grade('again')} disabled={submitting}
              />
              <GradeButton
                className="bg-bg-yellow border-secondary text-secondary"
                label="Hard" shortcut="2"
                onClick={() => grade('hard')} disabled={submitting}
              />
              <GradeButton
                className="bg-bg-blue border-primary text-primary"
                label="Good" shortcut="3"
                onClick={() => grade('good')} disabled={submitting}
              />
              <GradeButton
                className="bg-bg-green border-tertiary text-tertiary"
                label="Easy" shortcut="4"
                onClick={() => grade('easy')} disabled={submitting}
              />
            </div>
          )}
          <p className="text-center text-xs text-outline mt-3 hidden md:block">
            Tip: press Space to reveal, then 1–4 to grade
          </p>
        </div>
      </div>
    </div>
  );
}

function GradeButton({ className, label, shortcut, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 font-bold transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:hover:scale-100 ${className}`}
    >
      <span className="text-base">{label}</span>
      <span className="text-xs opacity-60 mt-0.5">({shortcut})</span>
    </button>
  );
}
