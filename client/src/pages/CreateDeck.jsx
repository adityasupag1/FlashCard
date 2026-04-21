import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import toast from 'react-hot-toast';

const SUBJECTS = ['Math', 'Science', 'History', 'Medicine', 'Language', 'CS', 'Other'];

export default function CreateDeck() {
  const nav = useNavigate();
  const fileInput = useRef(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Science');
  const [depth, setDepth] = useState('balanced');
  const [cardType, setCardType] = useState('qa');
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');

  const onFileSelect = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast.error('PDF must be under 50MB');
      return;
    }
    setFile(f);
    if (!title) {
      const name = f.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ');
      setTitle(name.slice(0, 80));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    onFileSelect(e.dataTransfer.files[0]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please upload a PDF first');
    if (!title.trim()) return toast.error('Please give your deck a title');

    setSubmitting(true);
    setProgress(10);
    setProgressText('Uploading your PDF…');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title);
    fd.append('subject', subject);
    fd.append('depth', depth);
    fd.append('cardType', cardType);

    try {
      // Simulate progress stages for better UX
      const stages = [
        { at: 30, text: 'Parsing PDF content…' },
        { at: 55, text: 'AI is reading your material…' },
        { at: 80, text: 'Generating high-quality cards…' },
      ];
      let stageIdx = 0;
      const interval = setInterval(() => {
        if (stageIdx < stages.length) {
          setProgress(stages[stageIdx].at);
          setProgressText(stages[stageIdx].text);
          stageIdx++;
        }
      }, 3000);

      const { data } = await api.post('/decks/generate', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 10 * 60 * 1000, // up to 10 minutes for AI
      });
      clearInterval(interval);
      setProgress(100);
      setProgressText('Done!');
      toast.success(`Created ${data.cardsGenerated} cards from your PDF`);
      setTimeout(() => nav(`/decks/${data.deck._id}`), 400);
    } catch (err) {
      setSubmitting(false);
      setProgress(0);
      const msg = err.response?.data?.message || err.message || 'Something went wrong';
      toast.error(msg);
      if (err.response?.status === 422) nav('/create', { state: { error: msg } });
    }
  };

  return (
    <div className="bg-surface min-h-screen">
      <Navbar />

      <header className="bg-bg-blue py-10">
        <div className="max-w-[760px] mx-auto px-6 flex justify-between items-center">
          <div>
            <nav className="flex items-center gap-2 mb-2 text-sm text-primary">
              <Link to="/decks" className="font-medium hover:underline">My Decks</Link>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="font-medium text-text-body">Create</span>
            </nav>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
              <h1 className="text-h3-card text-on-surface">Create a new deck</h1>
            </div>
          </div>
          <span className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider hidden md:inline">
            PDF → Cards
          </span>
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-6 py-12 space-y-6">
        {!file ? (
          <section
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`custom-dashed h-[240px] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group ${
              dragOver ? 'bg-bg-blue' : 'bg-white hover:bg-blue-50/50'
            }`}
          >
            <span className="material-symbols-outlined text-[56px] text-primary mb-4 group-hover:scale-110 transition-transform">
              cloud_upload
            </span>
            <p className="text-[20px] font-bold text-on-surface">Drop your PDF here</p>
            <p className="text-body-secondary text-text-body mt-1">or click to browse — up to 50MB</p>
            <div className="mt-4 bg-surface-container-high px-4 py-1 rounded-full flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">description</span>
              <span className="text-xs font-bold text-on-surface-variant">PDF</span>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => onFileSelect(e.target.files[0])}
            />
          </section>
        ) : (
          <section className="bg-white rounded-xl shadow-card border-l-4 border-primary p-4 flex items-center justify-between animate-slide-up">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-bg-blue rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface">{file.name}</h3>
                <p className="text-body-secondary text-text-body">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            {!submitting && (
              <button
                onClick={() => setFile(null)}
                className="w-8 h-8 rounded-full border border-error text-error flex items-center justify-center hover:bg-bg-red transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </section>
        )}

        {/* Settings */}
        <form onSubmit={submit}>
          <section className="bg-bg-yellow rounded-xl p-6 md:p-8 border-l-4 border-secondary-container space-y-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-secondary-container/20 pb-4">
              <span className="material-symbols-outlined text-secondary">settings_suggest</span>
              <h2 className="text-[20px] font-bold text-on-surface">Deck settings</h2>
            </div>

            <div className="space-y-2">
              <label className="text-body-secondary font-bold text-on-surface">Deck Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-border-subtle rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="e.g., Biology Chapter 4: Molecular Basis"
              />
            </div>

            <div className="space-y-3">
              <label className="text-body-secondary font-bold text-on-surface">Subject</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setSubject(s)}
                    className={`px-4 py-2 rounded-full border font-medium text-sm transition-all ${
                      subject === s
                        ? 'border-2 border-primary bg-primary text-white'
                        : 'border-secondary-container bg-white text-secondary hover:bg-secondary-container hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-body-secondary font-bold text-on-surface">Study Depth</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DepthCard
                  icon="bolt"
                  name="Quick"
                  desc="Key terms & surface facts."
                  selected={depth === 'quick'}
                  color="primary"
                  onClick={() => setDepth('quick')}
                />
                <DepthCard
                  icon="balance"
                  name="Balanced"
                  desc="Mix of concepts and examples."
                  selected={depth === 'balanced'}
                  color="secondary-container"
                  onClick={() => setDepth('balanced')}
                  popular
                />
                <DepthCard
                  icon="psychology"
                  name="Deep dive"
                  desc="Comprehensive analytical cards."
                  selected={depth === 'deep'}
                  color="tertiary-container"
                  onClick={() => setDepth('deep')}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-body-secondary font-bold text-on-surface">Card Type</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'qa', name: 'Q & A' },
                  { id: 'cloze', name: 'Cloze (fill-in-the-blank)' },
                  { id: 'mixed', name: 'Mixed' },
                ].map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setCardType(t.id)}
                    className={`px-4 py-2 rounded-full border font-medium text-sm transition-all ${
                      cardType === t.id
                        ? 'border-2 border-primary bg-primary text-white'
                        : 'border-secondary-container bg-white text-secondary hover:bg-secondary-container hover:text-white'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {submitting && (
            <div className="mt-6 bg-white p-6 rounded-xl border border-primary/20 shadow-card animate-slide-up">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <p className="font-bold text-on-surface">{progressText}</p>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-on-surface-variant mt-2">
                This can take 20–60 seconds depending on PDF length.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={() => nav('/decks')}
              className="px-6 py-3 rounded-lg border border-border-subtle text-on-surface-variant font-semibold hover:bg-surface-container-low transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !file || !title}
              className="px-8 py-3 bg-primary text-white rounded-lg font-bold shadow-md hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 inline-flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              {submitting ? 'Generating cards…' : 'Generate cards'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function DepthCard({ icon, name, desc, selected, color, onClick, popular }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white p-4 rounded-xl border-2 cursor-pointer hover:shadow-md transition-all relative ${
        selected ? `border-${color}` : 'border-border-subtle'
      }`}
    >
      {popular && (
        <span className="absolute -top-2 -right-2 bg-secondary-container text-[10px] font-bold text-white px-2 py-0.5 rounded-full uppercase">
          Popular
        </span>
      )}
      <div className="flex justify-between items-start mb-2">
        <span className={`material-symbols-outlined text-${color === 'secondary-container' ? 'secondary' : color === 'tertiary-container' ? 'tertiary' : 'primary'}`}>
          {icon}
        </span>
        {selected && (
          <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        )}
      </div>
      <p className="font-bold text-on-surface">{name}</p>
      <p className="text-[12px] text-text-body leading-tight">{desc}</p>
    </div>
  );
}
