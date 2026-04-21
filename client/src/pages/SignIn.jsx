import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function SignIn() {
  const { login, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      nav(loc.state?.from?.pathname || '/decks', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sign in failed');
    }
  };

  return (
    <div className="min-h-screen bg-bg-blue flex flex-col items-center justify-center p-6">
      <div className="mb-8 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          layers
        </span>
        <Link to="/" className="text-2xl font-black tracking-tighter text-primary">FlashDeck</Link>
      </div>

      <main className="w-full max-w-md bg-white rounded-2xl shadow-card-hover p-8 md:p-10 border border-border-subtle">
        <div className="text-center mb-8">
          <h2 className="text-h3-card text-on-surface mb-2">Welcome back</h2>
          <p className="text-body-secondary text-text-body">Sign in to pick up where you left off</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-body-secondary font-semibold text-on-surface-variant ml-1 block">
              Email address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                placeholder="name@example.com"
              />
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline/50 pointer-events-none">
                mail
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="password" className="text-body-secondary font-semibold text-on-surface-variant">
                Password
              </label>
              <a className="text-body-secondary text-primary hover:underline" href="#">Forgot password?</a>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline/50 hover:text-on-surface-variant"
              >
                <span className="material-symbols-outlined">{showPwd ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-primary text-white font-bold shadow-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:bg-primary-container mt-4 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border-subtle text-center">
          <p className="text-body-main text-text-body">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-bold hover:underline">Sign up</Link>
          </p>
        </div>
      </main>

      <footer className="mt-8 flex items-center gap-2 text-text-body opacity-80">
        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
        <p className="text-body-secondary text-[12px] uppercase tracking-widest">Your data is encrypted and secure</p>
      </footer>
    </div>
  );
}
