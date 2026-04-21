import { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [dailyGoal, setDailyGoal] = useState(user?.preferences?.dailyGoal || 20);
  const [theme, setTheme] = useState(user?.preferences?.theme || 'light');
  const [soundEffects, setSoundEffects] = useState(user?.preferences?.soundEffects ?? true);
  const [notifications, setNotifications] = useState(user?.preferences?.notifications ?? true);
  const [saving, setSaving] = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name,
        email,
        preferences: { dailyGoal: Number(dailyGoal), theme, soundEffects, notifications },
      });
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) return toast.error('New passwords do not match');
    if (newPwd.length < 6) return toast.error('Password must be at least 6 characters');
    try {
      await updateProfile({ password: newPwd });
      toast.success('Password updated');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password');
    }
  };

  return (
    <div className="bg-surface min-h-screen">
      <Navbar />
      <header className="bg-bg-blue py-10">
        <div className="max-w-screen-lg mx-auto px-6 md:px-8">
          <h1 className="text-h2-section text-on-surface">Settings</h1>
          <p className="text-on-surface-variant mt-1">Manage your account and study preferences.</p>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-6 md:px-8 py-10 space-y-6">
        {/* Profile */}
        <section className="bg-white rounded-xl shadow-card border border-border-subtle p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary">person</span>
            <h2 className="text-h3-card text-xl">Profile</h2>
          </div>
          <form onSubmit={saveProfile} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Full name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </Field>
            </div>

            {/* Preferences */}
            <div className="pt-4 border-t border-border-subtle">
              <h3 className="font-bold text-on-surface mb-4">Study preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Daily goal (cards)">
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary outline-none"
                  />
                </Field>
                <Field label="Theme">
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark (coming soon)</option>
                    <option value="auto">Auto</option>
                  </select>
                </Field>
              </div>
              <div className="mt-5 space-y-3">
                <Toggle
                  label="Sound effects"
                  desc="Play a small sound when you grade a card."
                  value={soundEffects}
                  onChange={setSoundEffects}
                />
                <Toggle
                  label="Daily reminder notifications"
                  desc="Nudge me when I have cards due."
                  value={notifications}
                  onChange={setNotifications}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold hover:scale-[1.03] transition-transform disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>

        {/* Change password */}
        <section className="bg-white rounded-xl shadow-card border border-border-subtle p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary">lock</span>
            <h2 className="text-h3-card text-xl">Change password</h2>
          </div>
          <form onSubmit={changePassword} className="space-y-4">
            <Field label="Current password">
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary outline-none"
              />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="New password">
                <input
                  type="password"
                  minLength={6}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary outline-none"
                />
              </Field>
              <Field label="Confirm new password">
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary outline-none"
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold hover:scale-[1.03] transition-transform"
              >
                Update password
              </button>
            </div>
          </form>
        </section>

        {/* Danger zone */}
        <section className="bg-bg-red/40 rounded-xl border border-error/30 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-error">warning</span>
            <h2 className="text-h3-card text-xl text-error">Account</h2>
          </div>
          <p className="text-sm text-on-surface-variant mb-4">
            Sign out of your account on this device. You can sign back in anytime.
          </p>
          <button
            onClick={() => { if (confirm('Sign out of FlashDeck?')) { logout(); window.location.href = '/'; } }}
            className="px-5 py-2.5 bg-white border-2 border-error text-error rounded-lg font-bold hover:bg-bg-red/50 transition-colors"
          >
            Sign out
          </button>
        </section>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="text-body-secondary font-semibold text-on-surface-variant">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, desc, value, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-5 h-5 rounded accent-primary cursor-pointer"
      />
      <div>
        <p className="font-semibold text-on-surface">{label}</p>
        <p className="text-sm text-on-surface-variant">{desc}</p>
      </div>
    </label>
  );
}
