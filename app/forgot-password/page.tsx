'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch {
      setError('Something went wrong. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#162540] p-8 shadow-2xl shadow-black/40">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8ff7ef] to-[#1fe5d8]">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#0d1a35]" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 018 0v3" />
          </svg>
        </div>

        {sent ? (
          <>
            <h1 className="text-2xl font-bold text-white">Check your email</h1>
            <p className="mt-2 text-sm text-[#9fb0c8]">
              If an account exists for <span className="text-white">{email.trim()}</span>, we have sent a link to reset your password. It expires in 1 hour.
            </p>
            <Link
              href="/login"
              className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#1fe5d8] to-[#7df5ec] text-sm font-semibold text-[#162540] transition hover:-translate-y-0.5"
            >
              Back to login
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white">Forgot your password?</h1>
            <p className="mt-2 text-sm text-[#9fb0c8]">
              Enter your email and we will send you a link to choose a new one.
            </p>

            {error && (
              <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-center text-sm text-red-400">
                {error}
              </p>
            )}

            <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-xs text-[#9fb0c8]">
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-[#1fe5d8] focus:ring-4 focus:ring-[#1fe5d8]/15"
                />
              </label>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1fe5d8] to-[#7df5ec] text-sm font-semibold text-[#162540] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#162540]/30 border-t-[#162540]" />
                )}
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-[#9fb0c8]">
              Remembered it?{' '}
              <Link href="/login" className="font-semibold text-[#1fe5d8] hover:underline">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}