'use client';
import { useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';

const inputClass =
  'w-full rounded-md border border-line bg-transparent p-2.5 text-sm outline-none transition-colors focus:border-brand-dark focus:ring-1 focus:ring-brand/50';
const buttonClass =
  'rounded-md bg-brand px-5 py-2 text-sm font-semibold text-on-brand transition-all hover:bg-brand-dark disabled:opacity-50';
const labelClass = 'mb-1 block text-xs font-semibold tracking-wide text-muted';

const messageOf = (e: unknown) => (e as { message?: string })?.message || 'Something went wrong';

function SettingsInner() {
  const auth = useAuth() as ReturnType<typeof useAuth> & { refreshUser?: () => Promise<void> };
  const { user } = auth;
  const { show } = useToast();

  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  if (!user) return null;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return show('Name cannot be empty', 'error');
    setSavingName(true);
    try {
      await api.updateMe(trimmed);
      if (auth.refreshUser) await auth.refreshUser();
      else window.location.reload();
      show('Profile updated');
    } catch (err) {
      show(messageOf(err), 'error');
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) return show('New password must be at least 8 characters', 'error');
    if (next !== confirm) return show('The two new passwords do not match', 'error');
    setSavingPw(true);
    try {
      await api.changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      show('Password updated');
    } catch (err) {
      show(messageOf(err), 'error');
    } finally {
      setSavingPw(false);
    }
  }

  return (
    // profile and password sit side by side so the page fits one screen
    <div className="mx-auto grid max-w-5xl content-start gap-5 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted">Manage your profile and password</p>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-line bg-surface p-6 lg:col-span-2">
        <Avatar name={user.name} size={64} />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-navy">{user.name}</p>
          <p className="truncate text-sm text-muted">{user.email}</p>
          <span className="mt-1 inline-block rounded-full border border-brand-dark/30 bg-brand/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-dark">
            {user.role}
          </span>
        </div>
      </div>

      <form onSubmit={saveProfile} className="space-y-4 rounded-xl border border-line bg-surface p-6">
        <h2 className="text-sm font-semibold text-navy">Profile</h2>
        <div>
          <label htmlFor="full-name" className={labelClass}>Full name</label>
          <input id="full-name" className={inputClass} value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input id="email" className={`${inputClass} opacity-60`} value={user.email} disabled readOnly />
        </div>
        <button className={buttonClass} disabled={savingName || name.trim() === user.name}>
          {savingName ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <form onSubmit={savePassword} className="space-y-4 rounded-xl border border-line bg-surface p-6">
        <h2 className="text-sm font-semibold text-navy">Change password</h2>
        <div>
          <label htmlFor="current-pw" className={labelClass}>Current password</label>
          <input id="current-pw" type="password" autoComplete="current-password" className={inputClass} value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="new-pw" className={labelClass}>New password</label>
            <input id="new-pw" type="password" autoComplete="new-password" className={inputClass} value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div>
            <label htmlFor="confirm-pw" className={labelClass}>Confirm new password</label>
            <input id="confirm-pw" type="password" autoComplete="new-password" className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-muted">At least 8 characters.</p>
        <button className={buttonClass} disabled={savingPw || !current || !next || !confirm}>
          {savingPw ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsInner />
    </RequireAuth>
  );
}
