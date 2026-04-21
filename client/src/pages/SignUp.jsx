import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function SignUp() {
  const { register, loading } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await register(form.name, form.email, form.password);
      toast.success(`Welcome to FlashDeck, ${form.name}!`);
      nav('/decks', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sign up failed');
    }
  };

  return (
    <div className="min-h-screen bg-bg-green flex flex-col items-center justify-center p-6">
      <div className="mb-8 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          layers
        </span>
        <Link to="/" className="text-2xl font-black tracking-tighter text-primary">FlashDeck</Link>
      </div>

      <main className="w-full max-w-md bg-white rounded-2xl shadow-card-hover p-8 md:p-10 border border-border-subtle">
        <div className="text-center mb-8">
          <h2 className="text-h3-card text-on-surface mb-2">Create your account</h2>
          <p className="text-body-secondary text-text-body">Start turning PDFs into decks in seconds</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-body-secondary font-semibold text-on-surface-variant ml-1 block">Full name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              placeholder="Alex Smith"
            />
          </div>
          <div className="space-y-2">
            <label className="text-body-secondary font-semibold text-on-surface-variant ml-1 block">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-body-secondary font-semibold text-on-surface-variant ml-1 block">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              placeholder="At least 6 characters"
            />
          </div>
          <div className="space-y-2">
            <label className="text-body-secondary font-semibold text-on-surface-variant ml-1 block">Confirm password</label>
            <input
              type="password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              placeholder="Re-enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-primary text-white font-bold shadow-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:bg-primary-container mt-4 disabled:opacity-60"
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border-subtle text-center">
          <p className="text-body-main text-text-body">
            Already have an account?{' '}
            <Link to="/signin" className="text-primary font-bold hover:underline">Sign in</Link>
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
