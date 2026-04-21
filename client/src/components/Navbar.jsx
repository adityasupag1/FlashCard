import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const linkClasses = ({ isActive }) =>
    isActive
      ? 'text-primary border-b-2 border-primary pb-1 font-medium text-sm tracking-tight'
      : 'text-slate-600 hover:text-primary transition-colors font-medium text-sm tracking-tight';

  return (
    <nav className="sticky top-0 w-full h-[64px] z-50 bg-white/95 backdrop-blur-md border-b border-border-subtle shadow-sm flex items-center justify-between px-6 md:px-12">
      <div className="flex items-center gap-8">
        <Link to={user ? '/decks' : '/'} className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-primary text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            layers
          </span>
          <span className="text-2xl font-black tracking-tighter text-primary">FlashDeck</span>
        </Link>
        {user && (
          <div className="hidden md:flex items-center gap-6 h-16">
            <NavLink to="/decks" className={linkClasses}>My Decks</NavLink>
            <NavLink to="/explore" className={linkClasses}>Explore</NavLink>
            <NavLink to="/analytics" className={linkClasses}>Progress</NavLink>
            <NavLink to="/create" className={linkClasses}>Create</NavLink>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {!user ? (
          <>
            <Link
              to="/signin"
              className="hidden md:block px-5 py-2 rounded-lg border-2 border-primary text-primary font-semibold text-sm hover:bg-primary-fixed/30 transition-all duration-300"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Get Started
            </Link>
          </>
        ) : (
          <>
            <button className="p-2 rounded-full hover:bg-slate-100 transition-colors relative" title="Notifications">
              <span className="material-symbols-outlined text-slate-500">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent-red rounded-full border-2 border-white" />
            </button>
            <Link to="/settings" className="p-2 rounded-full hover:bg-slate-100 transition-colors" title="Settings">
              <span className="material-symbols-outlined text-slate-500">settings</span>
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-9 h-9 rounded-full bg-primary-fixed overflow-hidden flex items-center justify-center text-primary font-bold"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  (user.name || 'U').charAt(0).toUpperCase()
                )}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-card-hover border border-border-subtle py-2 z-50 animate-slide-up">
                  <div className="px-4 py-2 border-b border-border-subtle">
                    <p className="text-sm font-bold text-on-surface truncate">{user.name}</p>
                    <p className="text-xs text-text-body truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/settings'); }}
                    className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">settings</span> Settings
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/analytics'); }}
                    className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">insights</span> Progress
                  </button>
                  <button
                    onClick={() => { logout(); navigate('/'); }}
                    className="w-full text-left px-4 py-2 text-sm text-error hover:bg-bg-red/50 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">logout</span> Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
