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
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      setError('Email and password are required');
      return;
    }
    try {
      await login(trimmedEmail, trimmedPassword);
      router.push('/tickets');
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setError('Invalid email or password');
      } else {
        setError('Something went wrong. Try again.');
      }
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="animate-fade-slide-up w-full max-w-sm flex flex-col gap-4 rounded-xl border border-white/10 bg-black/40 p-8 shadow-xl backdrop-blur"
      >
        <h1 className="text-2xl font-bold text-center">Sign In</h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold tracking-wide text-zinc-400">
            Email
          </label>
          <input
            className="border border-white/20 bg-transparent rounded-md p-2 outline-none focus:border-white transition-colors"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold tracking-wide text-zinc-400">
            Password
          </label>
          <input
            className="border border-white/20 bg-transparent rounded-md p-2 outline-none focus:border-white transition-colors"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          className="mt-2 bg-white text-black font-semibold rounded-md p-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          type="submit"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}