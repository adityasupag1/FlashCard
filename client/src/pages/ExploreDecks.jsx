import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const SUBJECTS = ['All', 'Math', 'Science', 'History', 'Medicine', 'Language', 'CS', 'Other'];

const SUBJECT_STYLES = {
  Math: 'border-primary bg-bg-blue text-primary',
  Science: 'border-tertiary bg-bg-green text-tertiary',
  History: 'border-secondary bg-bg-yellow text-secondary',
  Medicine: 'border-accent-red bg-bg-red text-accent-red',
  Language: 'border-purple-500 bg-purple-100 text-purple-700',
  CS: 'border-primary bg-bg-blue text-primary',
  Other: 'border-outline bg-surface-container text-on-surface-variant',
};

export default function ExploreDecks() {
  const { user } = useAuth();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/decks/public');
        setDecks(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = decks.filter((d) => {
    if (subject !== 'All' && d.subject !== subject) return false;
    if (query && !d.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="bg-surface min-h-screen">
      <Navbar />

      <header className="bg-bg-blue py-16">
        <div className="max-w-screen-xl mx-auto px-6 md:px-8 text-center">
          <h1 className="text-h1-hero text-on-surface mb-4">Explore community decks</h1>
          <p className="text-xl text-on-surface-variant max-w-2xl mx-auto mb-8">
            Study from decks shared by other learners, or share your own for the community to use.
          </p>
          <div className="max-w-xl mx-auto relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-sm"
            />
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 md:px-8 py-10">
        {/* Subject filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() => setSubject(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                subject === s
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border-subtle text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center text-on-surface-variant">Loading community decks…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border-subtle p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-outline-variant mb-3">travel_explore</span>
            <h3 className="text-xl font-bold text-on-surface mb-2">No public decks yet</h3>
            <p className="text-on-surface-variant max-w-md mx-auto">
              Be the first to share a deck! Open any of your decks and switch on "public" to help others learn.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((d) => {
              const subStyle = SUBJECT_STYLES[d.subject] || SUBJECT_STYLES.Other;
              const [borderClass, bgClass, textClass] = subStyle.split(' ');
              return (
                <Link
                  key={d._id}
                  to={user ? `/decks/${d._id}` : '/signin'}
                  className={`bg-white rounded-xl shadow-card border-t-4 ${borderClass} p-5 card-lift flex flex-col gap-3`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${bgClass} ${textClass}`}>
                      {d.subject}
                    </span>
                    <span className="text-xs text-slate-400">{d.cardCount || 0} cards</span>
                  </div>
                  <h3 className="text-lg font-bold text-on-surface leading-tight">{d.title}</h3>
                  {d.description && (
                    <p className="text-sm text-on-surface-variant line-clamp-2">{d.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-border-subtle mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-xs font-bold text-primary">
                        {(d.user?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-on-surface-variant">{d.user?.name || 'Anonymous'}</span>
                    </div>
                    <span className="text-xs font-bold text-primary">View →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
