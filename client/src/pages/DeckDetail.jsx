import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function DeckDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState(null); // null | 'new' | cardObject
  const [cardForm, setCardForm] = useState({ front: '', back: '', hint: '', topic: '' });
  const [filter, setFilter] = useState('all'); // all | new | learning | mastered
  const [search, setSearch] = useState('');

  const fetchDeck = async () => {
    try {
      const { data } = await api.get(`/decks/${id}`);
      setDeck(data.deck);
      setCards(data.cards);
      setDueCount(data.dueCount);
    } catch (err) {
      toast.error('Could not load deck');
      nav('/decks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openNewCard = () => {
    setCardForm({ front: '', back: '', hint: '', topic: '' });
    setEditingCard('new');
  };
  const openEditCard = (c) => {
    setCardForm({ front: c.front, back: c.back, hint: c.hint || '', topic: c.topic || '' });
    setEditingCard(c);
  };

  const saveCard = async (e) => {
    e.preventDefault();
    if (!cardForm.front.trim() || !cardForm.back.trim()) {
      toast.error('Front and back are required');
      return;
    }
    try {
      if (editingCard === 'new') {
        await api.post('/cards', { deckId: deck._id, ...cardForm });
        toast.success('Card added');
      } else {
        await api.put(`/cards/${editingCard._id}`, cardForm);
        toast.success('Card updated');
      }
      setEditingCard(null);
      fetchDeck();
    } catch (err) {
      toast.error('Could not save card');
    }
  };

  const deleteCard = async (cardId) => {
    if (!confirm('Delete this card?')) return;
    try {
      await api.delete(`/cards/${cardId}`);
      toast.success('Card deleted');
      fetchDeck();
    } catch {
      toast.error('Failed to delete card');
    }
  };

  const togglePin = async () => {
    try {
      const { data } = await api.put(`/decks/${deck._id}`, { isPinned: !deck.isPinned });
      setDeck(data);
      toast.success(data.isPinned ? 'Pinned' : 'Unpinned');
    } catch {
      toast.error('Failed');
    }
  };

  const deleteDeck = async () => {
    if (!confirm(`Delete "${deck.title}" and all ${cards.length} cards? This cannot be undone.`)) return;
    try {
      await api.delete(`/decks/${deck._id}`);
      toast.success('Deck deleted');
      nav('/decks');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = cards.filter((c) => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search && !`${c.front} ${c.back}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="bg-surface min-h-screen">
        <Navbar />
        <div className="py-20 text-center text-on-surface-variant">Loading deck…</div>
      </div>
    );
  }
  if (!deck) return null;

  const total = deck.cardCount || cards.length;
  const masteredPct = total ? Math.round((deck.masteredCount / total) * 100) : 0;

  return (
    <div className="bg-surface min-h-screen">
      <Navbar />

      {/* Header */}
      <header className="bg-bg-blue py-10">
        <div className="max-w-screen-xl mx-auto px-6 md:px-8">
          <nav className="flex items-center gap-2 mb-4 text-sm text-primary">
            <Link to="/decks" className="font-medium hover:underline">My Decks</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="font-medium text-text-body truncate max-w-[200px]">{deck.title}</span>
          </nav>
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-white px-2 py-0.5 rounded">
                  {deck.subject}
                </span>
                {deck.isPinned && (
                  <span className="text-[10px] uppercase font-bold text-secondary bg-bg-yellow px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                    Pinned
                  </span>
                )}
                {deck.isPublic && (
                  <span className="text-[10px] uppercase font-bold text-tertiary bg-bg-green px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">public</span> Public
                  </span>
                )}
              </div>
              <h1 className="text-h2-section text-on-surface leading-tight">{deck.title}</h1>
              {deck.sourceFileName && (
                <p className="flex items-center gap-2 text-sm text-text-body mt-2">
                  <span className="material-symbols-outlined text-sm">description</span>
                  {deck.sourceFileName}
                </p>
              )}
              <div className="flex gap-6 mt-6">
                <StatBlock label="New" value={deck.newCount} color="text-primary" />
                <StatBlock label="Learning" value={deck.learningCount} color="text-secondary" />
                <StatBlock label="Mastered" value={deck.masteredCount} color="text-tertiary" />
                <StatBlock label="Due today" value={dueCount} color="text-accent-red" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/study/${deck._id}`}
                className="px-6 py-3 bg-primary text-white rounded-lg font-bold shadow-md hover:scale-[1.03] active:scale-[0.97] transition-all inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined">play_arrow</span>
                Study now
              </Link>
              <button
                onClick={openNewCard}
                className="px-6 py-3 bg-white border-2 border-primary text-primary rounded-lg font-bold hover:bg-primary-fixed/30 transition-all inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined">add</span>
                Add card
              </button>
              <button
                onClick={togglePin}
                className="px-4 py-3 bg-white border border-border-subtle text-on-surface-variant rounded-lg hover:bg-surface-container-low"
                title={deck.isPinned ? 'Unpin' : 'Pin'}
              >
                <span className="material-symbols-outlined">{deck.isPinned ? 'keep_off' : 'push_pin'}</span>
              </button>
              <button
                onClick={deleteDeck}
                className="px-4 py-3 bg-white border border-error text-error rounded-lg hover:bg-bg-red/50"
                title="Delete deck"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="mt-8">
            <div className="flex justify-between text-xs font-bold text-on-surface-variant mb-2">
              <span>Overall mastery</span>
              <span>{masteredPct}%</span>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-tertiary transition-all" style={{ width: `${masteredPct}%` }} />
            </div>
          </div>
        </div>
      </header>

      {/* Cards list */}
      <main className="max-w-screen-xl mx-auto px-6 md:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex gap-2">
            {['all', 'new', 'learning', 'mastered'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                  filter === f ? 'bg-primary text-white' : 'bg-white border border-border-subtle text-on-surface-variant'
                }`}
              >
                {f} {f !== 'all' && <span className="ml-1 opacity-70">{cards.filter((c) => c.status === f).length}</span>}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cards…"
              className="w-full pl-10 pr-4 py-2 bg-white border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm outline-none"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-border-subtle p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-outline-variant mb-3">style</span>
            <p className="text-on-surface-variant">No cards match.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((c) => (
              <div
                key={c._id}
                className="bg-white rounded-xl shadow-card border-l-4 p-4 hover:shadow-card-hover transition-all"
                style={{
                  borderColor:
                    c.status === 'mastered' ? '#006b2b' : c.status === 'learning' ? '#795900' : '#0058bd',
                }}
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <span
                    className="text-[10px] uppercase font-bold px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: c.status === 'mastered' ? '#E6F4EA' : c.status === 'learning' ? '#FFF8E1' : '#E8F0FE',
                      color: c.status === 'mastered' ? '#006b2b' : c.status === 'learning' ? '#795900' : '#0058bd',
                    }}
                  >
                    {c.status}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditCard(c)}
                      className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={() => deleteCard(c._id)}
                      className="p-1 rounded hover:bg-bg-red/50 text-error"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
                <p className="font-bold text-on-surface mb-2 line-clamp-2">{c.front}</p>
                <p className="text-sm text-on-surface-variant line-clamp-3">{c.back}</p>
                {c.topic && (
                  <p className="text-[11px] text-primary font-bold uppercase tracking-wider mt-2">{c.topic}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Card editor modal */}
      <Modal
        open={editingCard !== null}
        onClose={() => setEditingCard(null)}
        title={editingCard === 'new' ? 'Add a card' : 'Edit card'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={saveCard} className="space-y-4">
          <div className="space-y-2">
            <label className="text-body-secondary font-semibold text-on-surface-variant">Topic (optional)</label>
            <input
              value={cardForm.topic}
              onChange={(e) => setCardForm({ ...cardForm, topic: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary outline-none"
              placeholder="e.g., Cell Biology"
            />
          </div>
          <div className="space-y-2">
            <label className="text-body-secondary font-semibold text-on-surface-variant">Front (question)</label>
            <textarea
              required
              rows={3}
              value={cardForm.front}
              onChange={(e) => setCardForm({ ...cardForm, front: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary outline-none resize-none"
              placeholder="What is...?"
            />
          </div>
          <div className="space-y-2">
            <label className="text-body-secondary font-semibold text-on-surface-variant">Back (answer)</label>
            <textarea
              required
              rows={5}
              value={cardForm.back}
              onChange={(e) => setCardForm({ ...cardForm, back: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary outline-none resize-none"
              placeholder="The answer..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-body-secondary font-semibold text-on-surface-variant">Hint (optional)</label>
            <input
              value={cardForm.hint}
              onChange={(e) => setCardForm({ ...cardForm, hint: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary outline-none"
              placeholder="A small clue"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setEditingCard(null)}
              className="px-5 py-2.5 rounded-lg border border-border-subtle font-semibold hover:bg-surface-container-low"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary text-white rounded-lg font-bold hover:scale-[1.03] transition-transform"
            >
              {editingCard === 'new' ? 'Add card' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StatBlock({ label, value, color }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
      <p className={`text-stats-display text-2xl ${color}`}>{value || 0}</p>
    </div>
  );
}
