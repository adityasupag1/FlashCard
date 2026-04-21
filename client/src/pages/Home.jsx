import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="bg-surface min-h-screen">
      <Navbar />

      {/* Hero */}
      <header className="pt-20 pb-20 bg-bg-blue overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-reveal-up">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 rounded-full text-xs font-bold text-primary uppercase tracking-wider mb-6 border border-primary/20">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              AI-Powered Learning
            </span>
            <h1 className="text-h1-hero md:text-[56px] font-bold text-on-surface mb-6 leading-tight">
              Turn any PDF into a smart flashcard deck.
            </h1>
            <p className="text-lg text-on-surface-variant mb-8 leading-relaxed">
              Drop in a chapter, lecture notes, or textbook. Get back a clean set of cards — ready to practice with
              spaced repetition. Study smarter, remember longer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to={user ? '/create' : '/signup'}
                className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg inline-flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">upload_file</span>
                {user ? 'Create a deck' : 'Start for free'}
              </Link>
              <Link
                to="/explore"
                className="px-8 py-4 bg-white border-2 border-primary text-primary rounded-xl font-bold text-lg hover:bg-primary-fixed/30 transition-all duration-300 inline-flex items-center justify-center"
              >
                Explore decks
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-4 text-sm text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-tertiary text-base">check_circle</span> No credit card
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-tertiary text-base">check_circle</span> Free forever plan
              </span>
            </div>
          </div>

          <div className="relative flex justify-center py-10 animate-reveal-up" style={{ animationDelay: '200ms' }}>
            <div className="relative w-[340px] h-[420px]">
              <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl border border-border-subtle flex flex-col p-8 -rotate-12 -translate-x-12 z-0 animate-float" style={{ animationDelay: '0s' }}>
                <div className="h-3 w-1/2 bg-surface-container rounded mb-4" />
                <div className="h-2 w-full bg-surface-container-low rounded mb-2" />
                <div className="h-2 w-3/4 bg-surface-container-low rounded" />
              </div>
              <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl border border-border-subtle flex flex-col p-8 rotate-[8deg] translate-x-12 z-10 animate-float" style={{ animationDelay: '2s' }}>
                <div className="h-3 w-1/2 bg-surface-container rounded mb-4" />
                <div className="h-2 w-full bg-surface-container-low rounded mb-2" />
                <div className="h-2 w-3/4 bg-surface-container-low rounded" />
              </div>
              <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl border-t-4 border-primary flex flex-col p-8 z-20">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Cell Biology</span>
                  <span className="text-xs text-on-surface-variant">Card 4 of 42</span>
                </div>
                <h4 className="font-bold text-xl text-on-surface mb-6 leading-snug">
                  Explain the role of ribosomes in protein synthesis.
                </h4>
                <div className="mt-auto flex justify-center">
                  <button className="px-6 py-2 bg-primary-fixed text-on-primary-fixed rounded-full text-sm font-bold">
                    Flip card
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Why FlashDeck */}
      <section className="py-20 bg-bg-green">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12">
          <div className="text-center mb-12">
            <h2 className="text-h2-section text-on-surface mb-4">Backed by cognitive science</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">
              Two of the most effective study techniques — active recall and spaced repetition — combined into one
              clean workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: 'memory', title: 'Active Recall', text: 'Retrieval strengthens memory more than re-reading.' },
              { icon: 'update', title: 'Spaced Repetition', text: 'SM-2 schedules reviews at the optimal moment.' },
              { icon: 'bar_chart', title: 'Track Mastery', text: 'See exactly what is shaky before exam day.' },
              { icon: 'description', title: 'Deep Cards', text: 'AI synthesizes material into high-impact Q&As.' },
            ].map((c, i) => (
              <div
                key={c.title}
                className="bg-white p-6 rounded-xl shadow-card border-t-4 border-tertiary-container card-hover animate-reveal-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="material-symbols-outlined text-tertiary mb-4">{c.icon}</span>
                <h4 className="font-bold text-on-surface mb-2">{c.title}</h4>
                <p className="text-body-secondary text-on-surface-variant">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12">
          <div className="text-center mb-12">
            <h2 className="text-h2-section text-on-surface mb-4">From PDF to practice in 3 steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '1', title: 'Upload your PDF', text: 'Chapter, lecture notes, anything up to 50MB.', bg: 'bg-bg-blue', accent: 'text-primary' },
              { num: '2', title: 'AI generates cards', text: 'Deep, focused Q&As that cover the material.', bg: 'bg-bg-yellow', accent: 'text-secondary' },
              { num: '3', title: 'Study & master', text: 'Spaced reviews keep shaky cards coming back.', bg: 'bg-bg-green', accent: 'text-tertiary' },
            ].map((s) => (
              <div key={s.num} className={`${s.bg} rounded-2xl p-8`}>
                <div className={`text-6xl font-black ${s.accent} mb-4`}>{s.num}</div>
                <h3 className="text-xl font-bold text-on-surface mb-2">{s.title}</h3>
                <p className="text-on-surface-variant">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white px-6">
        <div className="max-w-screen-xl mx-auto bg-bg-blue rounded-3xl p-12 md:p-16 text-center">
          <h2 className="text-h1-hero text-on-surface mb-6">Ready to study smarter?</h2>
          <p className="text-on-surface-variant text-xl mb-10 max-w-xl mx-auto">
            Join learners who are hacking their study process with FlashDeck.
          </p>
          <Link
            to={user ? '/create' : '/signup'}
            className="inline-block px-10 py-5 bg-primary text-white rounded-xl font-black text-xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl"
          >
            {user ? 'Create your first deck' : 'Get started free'}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
