import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const SUBJECT_STYLES = {
  Math: { border: 'border-primary', bg: 'bg-bg-blue', text: 'text-primary' },
  Science: { border: 'border-tertiary', bg: 'bg-bg-green', text: 'text-tertiary' },
  History: { border: 'border-secondary', bg: 'bg-bg-yellow', text: 'text-secondary' },
  Medicine: { border: 'border-accent-red', bg: 'bg-bg-red', text: 'text-accent-red' },
  Language: { border: 'border-purple-500', bg: 'bg-purple-100', text: 'text-purple-700' },
  CS: { border: 'border-primary', bg: 'bg-bg-blue', text: 'text-primary' },
  Other: { border: 'border-outline', bg: 'bg-surface-container', text: 'text-on-surface-variant' },
};

export default function DeckCard({ deck, onChange }) {
  const nav = useNavigate();
  const s = SUBJECT_STYLES[deck.subject] || SUBJECT_STYLES.Other;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const total = deck.cardCount || 0;
  const mastered = deck.masteredCount || 0;
  const learning = deck.learningCount || 0;
  const newC = deck.newCount || 0;
  const masteredPct = total > 0 ? (mastered / total) * 100 : 0;
  const learningPct = total > 0 ? (learning / total) * 100 : 0;
  const newPct = total > 0 ? (newC / total) * 100 : 0;

  const togglePin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.put(`/decks/${deck._id}`, { isPinned: !deck.isPinned });
      toast.success(deck.isPinned ? 'Unpinned' : 'Pinned to top');
      onChange && onChange();
    } catch (err) {
      toast.error('Could not update deck');
    }
  };

  const del = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${deck.title}" and all ${total} cards? This cannot be undone.`)) return;
    try {
      await api.delete(`/decks/${deck._id}`);
      toast.success('Deck deleted');
      onChange && onChange();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div
      onClick={() => nav(`/decks/${deck._id}`)}
      className={`bg-white rounded-xl shadow-card border-t-4 ${s.border} p-5 card-lift transition-all duration-300 flex flex-col gap-3 cursor-pointer relative`}
    >
      <div className="flex justify-between items-start">
        <span className={`text-[10px] uppercase tracking-wider font-bold ${s.text} ${s.bg} px-2 py-0.5 rounded`}>
          {deck.subject}
        </span>
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="text-slate-400 hover:text-on-surface p-1 rounded-full hover:bg-slate-100"
          >
            <span className="material-symbols-outlined">more_vert</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-card-hover border border-border-subtle py-1 z-20">
              <button onClick={togglePin} className="w-full text-left px-3 py-2 text-sm hover:bg-surface-container-low flex items-center gap-2">
                <span className="material-symbols-outlined text-base">
                  {deck.isPinned ? 'keep_off' : 'push_pin'}
                </span>
                {deck.isPinned ? 'Unpin' : 'Pin to top'}
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); nav(`/decks/${deck._id}`); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-surface-container-low flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                Edit cards
              </button>
              <button onClick={del} className="w-full text-left px-3 py-2 text-sm text-error hover:bg-bg-red/50 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">delete</span>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-h3-card text-lg leading-tight font-bold">{deck.title}</h3>

      {deck.sourceFileName && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="material-symbols-outlined text-sm">description</span>
          <span className="truncate">{deck.sourceFileName}</span>
        </div>
      )}

      <div className="mt-2 flex gap-4">
        <div><p className="text-[10px] text-slate-400 font-bold uppercase">New</p><p className="text-stats-display text-lg text-primary">{newC}</p></div>
        <div><p className="text-[10px] text-slate-400 font-bold uppercase">Learning</p><p className="text-stats-display text-lg text-secondary">{learning}</p></div>
        <div><p className="text-[10px] text-slate-400 font-bold uppercase">Mastered</p><p className="text-stats-display text-lg text-tertiary">{mastered}</p></div>
      </div>

      <div className="w-full h-1.5 bg-slate-100 rounded-full flex overflow-hidden">
        <div className="bg-primary h-full" style={{ width: `${newPct}%` }} />
        <div className="bg-secondary-container h-full" style={{ width: `${learningPct}%` }} />
        <div className="bg-tertiary h-full" style={{ width: `${masteredPct}%` }} />
      </div>

      <div className="flex justify-between items-center text-[11px] font-bold pt-2 border-t mt-1">
        {deck.dueCount > 0 ? (
          <span className="text-accent-red flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-accent-red rounded-full" /> {deck.dueCount} due today
          </span>
        ) : (
          <span className="text-tertiary flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">check_circle</span> All caught up
          </span>
        )}
        <span className="text-slate-400">
          {new Date(deck.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      <Link
        to={`/study/${deck._id}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full mt-2 bg-primary text-white font-bold py-2 rounded-lg text-sm hover:scale-[1.02] transition-transform text-center"
      >
        Study now
      </Link>
    </div>
  );
}
