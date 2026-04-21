import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DeckCard from '../components/DeckCard';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SUBJECTS = ['All', 'Math', 'Science', 'History', 'Medicine', 'Language', 'CS', 'Other'];

export default function MyDecks() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [decks, setDecks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('All');
  const [view, setView] = useState('grid');
  const [sort, setSort] = useState('recent');

  const fetchAll = async () => {
    try {
      const [decksRes, statsRes] = await Promise.all([
        api.get('/decks'),
        api.get('/stats/overview'),
      ]);
      setDecks(decksRes.data);
      setStats(statsRes.data);
    } catch (err) {
      toast.error('Could not load your decks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    let list = decks.filter((d) =>
      (subject === 'All' || d.subject === subject) &&
      (query === '' || d.title.toLowerCase().includes(query.toLowerCase()))
    );
    if (sort === 'recent') list = [...list].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    if (sort === 'mastery') list = [...list].sort((a, b) => (b.masteredCount || 0) - (a.masteredCount || 0));
    if (sort === 'alpha') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [decks, query, subject, sort]);

  const pinned = filtered.filter((d) => d.isPinned);
  const others = filtered.filter((d) => !d.isPinned);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="bg-surface min-h-screen">
      <Navbar />
      <main className="max-w-[1440px] mx-auto px-6 md:px-8 py-6">
        {/* Welcome Banner */}
        <section className="w-full bg-bg-blue rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-6 md:px-8 py-6 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {greeting}, {user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="text-body-secondary text-on-surface-variant mt-1">
              {stats?.dueToday > 0
                ? `You have ${stats.dueToday} cards due for review today`
                : 'All caught up — great work! Start a new deck?'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-bg-yellow px-4 py-2 rounded-full flex items-center gap-2 border border-secondary-container/20">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                local_fire_department
              </span>
              <span className="text-body-secondary font-bold text-secondary">{stats?.streak || 0} day streak</span>
            </div>
            <div className="bg-bg-green px-4 py-2 rounded-full flex items-center gap-2 border border-tertiary-container/20">
              <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <span className="text-body-secondary font-bold text-tertiary">
                {stats?.masteredCount || 0} mastered
              </span>
            </div>
            <div className="bg-white px-4 py-2 rounded-full flex items-center gap-2 border border-primary/20 shadow-sm">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                library_books
              </span>
              <span className="text-body-secondary font-bold text-primary">
                {stats?.deckCount || 0} decks
              </span>
            </div>
          </div>
        </section>

        {/* Toolbar */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 shadow-sm border border-border-subtle">
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your decks..."
                className="w-full lg:w-[360px] pl-10 pr-4 py-2 bg-slate-50 border border-transparent focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary rounded-lg text-sm transition-all"
              />
            </div>
            <div className="flex gap-2 flex-wrap no-scrollbar">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    subject === s
                      ? 'bg-primary text-white'
                      : 'bg-bg-blue text-primary hover:bg-primary-fixed-dim'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-xs font-bold text-slate-600 border rounded-lg px-3 py-1.5 bg-slate-50 cursor-pointer"
            >
              <option value="recent">Recent</option>
              <option value="mastery">Most mastered</option>
              <option value="alpha">A–Z</option>
            </select>
            <div className="flex border border-border-subtle rounded-lg overflow-hidden">
              <button
                onClick={() => setView('grid')}
                className={`p-1.5 ${view === 'grid' ? 'bg-slate-100 text-primary' : 'bg-white text-slate-400'}`}
                title="Grid view"
              >
                <span className="material-symbols-outlined text-xl">grid_view</span>
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-1.5 ${view === 'list' ? 'bg-slate-100 text-primary' : 'bg-white text-slate-400'}`}
                title="List view"
              >
                <span className="material-symbols-outlined text-xl">list</span>
              </button>
            </div>
            <Link
              to="/create"
              className="bg-primary text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:scale-[1.03] active:scale-[0.97] transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span className="text-sm">New Deck</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-on-surface-variant">Loading your decks…</div>
        ) : decks.length === 0 ? (
          <EmptyState onCreate={() => nav('/create')} />
        ) : (
          <>
            {pinned.length > 0 && (
              <section className="mb-12 animate-reveal-up">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <h2 className="text-h3-card text-lg">Pinned</h2>
                </div>
                <GridOrList view={view} decks={pinned} onChange={fetchAll} />
              </section>
            )}
            <section className="animate-reveal-up" style={{ animationDelay: '100ms' }}>
              <h2 className="text-h3-card text-lg mb-4">All decks</h2>
              {others.length === 0 ? (
                <p className="text-on-surface-variant text-sm">No decks match your filters.</p>
              ) : (
                <GridOrList view={view} decks={others} onChange={fetchAll} />
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function GridOrList({ view, decks, onChange }) {
  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.map((d) => (
          <DeckCard key={d._id} deck={d} onChange={onChange} />
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {decks.map((d) => (
        <Link
          key={d._id}
          to={`/decks/${d._id}`}
          className="bg-white rounded-lg border-l-4 border-primary shadow-card card-hover p-4 flex items-center justify-between"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-primary bg-bg-blue px-2 py-0.5 rounded">{d.subject}</span>
              <span className="text-xs text-on-surface-variant">{d.cardCount} cards</span>
            </div>
            <h3 className="font-bold text-on-surface mt-1">{d.title}</h3>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <span className="text-tertiary font-bold">{d.masteredCount} mastered</span>
            {d.dueCount > 0 && <span className="text-accent-red font-bold">{d.dueCount} due</span>}
          </div>
        </Link>
      ))}
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="bg-white rounded-2xl border border-border-subtle p-12 text-center shadow-card">
      <div className="w-20 h-20 bg-bg-blue rounded-full mx-auto flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-primary text-4xl">library_books</span>
      </div>
      <h3 className="text-2xl font-bold text-on-surface mb-2">No decks yet</h3>
      <p className="text-on-surface-variant mb-6 max-w-md mx-auto">
        Upload a PDF and our AI will turn it into a clean, practice-ready flashcard deck in seconds.
      </p>
      <button
        onClick={onCreate}
        className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-md inline-flex items-center gap-2"
      >
        <span className="material-symbols-outlined">upload_file</span>
        Create your first deck
      </button>
    </div>
  );
}
