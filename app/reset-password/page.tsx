'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';

const inputClass =
  'h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-[#1fe5d8] focus:ring-4 focus:ring-[#1fe5d8]/15';

function ResetForm() {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 400) {
        setError('This link is invalid or has expired. Request a new one.');
      } else {
        setError('Something went wrong. Try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#162540] p-8 shadow-2xl shadow-black/40">
        {!token ? (
          <>
            <h1 className="text-2xl font-bold text-white">Link not valid</h1>
            <p className="mt-2 text-sm text-[#9fb0c8]">This reset link is missing its token. Request a new one.</p>
            <Link href="/forgot-password" className="mt-6 flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#1fe5d8] to-[#7df5ec] text-sm font-semibold text-[#162540]">
              Request a new link
            </Link>
          </>
        ) : done ? (
          <>
            <h1 className="text-2xl font-bold text-white">Password updated</h1>
            <p className="mt-2 text-sm text-[#9fb0c8]">You can now log in with your new password.</p>
            <Link href="/login" className="mt-6 flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#1fe5d8] to-[#7df5ec] text-sm font-semibold text-[#162540] transition hover:-translate-y-0.5">
              Go to login
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white">Choose a new password</h1>
            <p className="mt-2 text-sm text-[#9fb0c8]">Use at least 8 characters.</p>

            {error && (
              <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-center text-sm text-red-400">
                {error}
              </p>
            )}

            <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-xs text-[#9fb0c8]">
                New password
                <input type="password" autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5 text-xs text-[#9fb0c8]">
                Confirm password
                <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
              </label>
              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1fe5d8] to-[#7df5ec] text-sm font-semibold text-[#162540] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#162540]/30 border-t-[#162540]" />
                )}
                {loading ? 'Saving…' : 'Update password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}