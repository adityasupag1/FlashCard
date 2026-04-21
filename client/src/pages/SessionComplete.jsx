import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function SessionComplete() {
  const { state } = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    if (!state?.session) nav('/decks');
  }, [state, nav]);

  if (!state?.session) return null;
  const { session, streak, deck, stats } = state;
  const total = session.cardsReviewed || 0;
  const correct = session.correctCount || 0;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const minutes = Math.max(1, Math.round((session.durationSeconds || 0) / 60));

  return (
    <div className="bg-bg-green min-h-screen">
      <Navbar />
      <div className="max-w-screen-md mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl shadow-card-hover p-8 md:p-12 text-center border border-border-subtle animate-reveal-up">
          <div className="w-20 h-20 bg-bg-green rounded-full mx-auto flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-tertiary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              celebration
            </span>
          </div>
          <h1 className="text-h2-section text-on-surface mb-2">Session complete!</h1>
          <p className="text-on-surface-variant mb-8">
            Great work on <span className="font-bold text-on-surface">{deck?.title || 'your deck'}</span>.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Stat icon="style" label="Reviewed" value={total} color="text-primary" bg="bg-bg-blue" />
            <Stat icon="target" label="Accuracy" value={`${accuracy}%`} color="text-tertiary" bg="bg-bg-green" />
            <Stat icon="schedule" label="Time" value={`${minutes}m`} color="text-secondary" bg="bg-bg-yellow" />
            <Stat icon="local_fire_department" label="Streak" value={`${streak || 0}d`} color="text-accent-red" bg="bg-bg-red" />
          </div>

          {stats && (
            <div className="bg-surface-container-low rounded-xl p-4 mb-8">
              <p className="text-xs uppercase font-bold text-on-surface-variant mb-3">Grade breakdown</p>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <GradeStat label="Again" count={stats.again} color="text-accent-red" />
                <GradeStat label="Hard" count={stats.hard} color="text-secondary" />
                <GradeStat label="Good" count={stats.good} color="text-primary" />
                <GradeStat label="Easy" count={stats.easy} color="text-tertiary" />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {deck && (
              <Link
                to={`/study/${deck._id}`}
                className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:scale-[1.03] transition-transform inline-flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">replay</span>
                Study again
              </Link>
            )}
            <Link
              to="/decks"
              className="px-6 py-3 bg-white border-2 border-primary text-primary rounded-lg font-bold hover:bg-primary-fixed/30 transition-colors inline-flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">library_books</span>
              My decks
            </Link>
            <Link
              to="/analytics"
              className="px-6 py-3 bg-white border border-border-subtle text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-low transition-colors inline-flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">insights</span>
              See progress
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, color, bg }) {
  return (
    <div className={`${bg} rounded-xl p-4`}>
      <span className={`material-symbols-outlined ${color} mb-2`}>{icon}</span>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">{label}</p>
    </div>
  );
}

function GradeStat({ label, count, color }) {
  return (
    <div>
      <p className={`text-xl font-black ${color}`}>{count}</p>
      <p className="text-xs text-on-surface-variant">{label}</p>
    </div>
  );
}
