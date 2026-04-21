import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import Flashcard from '../components/Flashcard';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    (async () => {
      try {
        const [deckRes, dueRes, sessionRes] = await Promise.all([
          api.get(`/decks/${deckId}`),
          api.get(`/cards/deck/${deckId}/due?limit=30`),
          api.post('/reviews/session/start', { deckId }),
        ]);
        setDeck(deckRes.data.deck);
        const dueCards = dueRes.data;
        // If no cards are due (fresh deck / all caught up), fall back to newest cards
        const studyCards = dueCards.length > 0 ? dueCards : deckRes.data.cards.slice(0, 20);
        setCards(studyCards);
        setSession(sessionRes.data);
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

  const grade = async (g) => {
    if (submitting || !cards[idx]) return;
    setSubmitting(true);
    try {
      await api.post('/reviews/grade', {
        cardId: cards[idx]._id,
        grade: g,
        sessionId: session?._id,
      });
      setStats((s) => ({ ...s, [g]: s[g] + 1 }));
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
  const progressPct = Math.round(((idx) / cards.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-blue via-surface to-surface flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-border-subtle px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <button
          onClick={() => {
            if (confirm('End session early? Your progress so far will be saved.')) finishSession();
          }}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined">close</span>
          <span className="text-sm font-medium hidden md:inline">End session</span>
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
        <Flashcard
          card={current}
          index={idx}
          total={cards.length}
          onFlip={(flipped) => setShowGrades(flipped)}
        />

        {/* Grade buttons */}
        <div className="w-full max-w-2xl mt-8">
          {!showGrades ? (
            <button
              onClick={() => setShowGrades(true)}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Show answer <span className="text-white/60 text-xs ml-2 hidden md:inline">(Space)</span>
            </button>
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
