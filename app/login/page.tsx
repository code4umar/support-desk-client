'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiRequestError } from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      await login(trimmedEmail, trimmedPassword);
      router.push('/tickets');
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setError('Invalid email or password');
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center px-4 overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[400px] w-[400px] rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      <form
        onSubmit={onSubmit}
        className="animate-fade-slide-up relative w-full max-w-sm flex flex-col gap-4 rounded-xl border border-white/10 bg-black/40 p-8 shadow-2xl shadow-teal-500/10 backdrop-blur"
      >
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10 border border-teal-500/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-teal-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-center">Sign In</h1>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-md py-2">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold tracking-wide text-zinc-400">
            Email
          </label>
          <input
            className="border border-white/20 bg-transparent rounded-md p-2 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-colors"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold tracking-wide text-zinc-400">
            Password
          </label>
          <div className="relative">
            <input
              className="w-full border border-white/20 bg-transparent rounded-md p-2 pr-10 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-colors"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          className="mt-2 bg-teal-500 text-black font-semibold rounded-md p-2 transition-all hover:bg-teal-400 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Signing In…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}