'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import { useAuth } from '@/lib/auth-context';
import { ApiRequestError } from '@/lib/api';

const heading = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const body = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const css = `
@keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes flow { from { background-position: 0% 50%; } to { background-position: 200% 50%; } }
@keyframes glow { 0%, 100% { opacity: 0.45; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.18); } }
@keyframes shake {
  0%, 100% { transform: translateX(0); } 20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); }
}
@keyframes draw { to { stroke-dashoffset: 0; } }
@keyframes pop { 0% { transform: translateY(-50%) scale(0); opacity: 0; } 70% { transform: translateY(-50%) scale(1.25); } 100% { transform: translateY(-50%) scale(1); opacity: 1; } }
.rise { opacity: 0; animation: rise 0.65s cubic-bezier(0.2, 0.7, 0.2, 1) forwards; }
.flow { animation: flow 9s linear infinite; }
.glow { animation: glow 6s ease-in-out infinite; }
.shake { animation: shake 0.4s ease-in-out; }
.draw { stroke-dasharray: 30; stroke-dashoffset: 30; animation: draw 0.5s 0.25s ease forwards; }
.pop { animation: pop 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.2) forwards; }
.shimmer::after {
  content: ''; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%);
}
.shimmer:not(:disabled):hover::after { transform: translateX(100%); transition: transform 0.7s ease; }
@media (prefers-reduced-motion: reduce) {
  .rise, .flow, .glow, .shake, .pop { animation: none !important; opacity: 1 !important; transform: none !important; }
  .pop { transform: translateY(-50%) !important; }
  .draw { animation: none !important; stroke-dashoffset: 0 !important; }
  .shimmer::after { display: none; }
}
`;

const inputClass =
  'peer h-14 w-full rounded-xl border border-white/10 bg-white/5 px-4 pt-4 text-sm text-white outline-none transition-all duration-200 ' +
  'focus:border-[#e58a3c] focus:bg-white/[0.07] focus:ring-4 focus:ring-[#e58a3c]/15 ' +
  '[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#141d27] [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff]';

const labelClass =
  'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#8b95a1] transition-all duration-200 ' +
  'peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:text-[#e58a3c] ' +
  'peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px] ' +
  'peer-[:-webkit-autofill]:top-2.5 peer-[:-webkit-autofill]:translate-y-0 peer-[:-webkit-autofill]:text-[10px]';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STRENGTH_LABELS = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];
const STRENGTH_COLORS = ['bg-white/10', 'bg-red-400', 'bg-[#e58a3c]', 'bg-[#f5b942]', 'bg-emerald-400'];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [success, setSuccess] = useState(false);

  const canSubmit =
    name.trim() !== '' && email.trim() !== '' && password.trim() !== '' && !loading;
  const emailValid = EMAIL_RE.test(email.trim());

  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    try {
      await register(trimmedName, trimmedEmail, trimmedPassword);
      setSuccess(true);
      await new Promise((r) => setTimeout(r, 900));
      router.push('/tickets');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${body.className} flex items-center justify-center px-4 py-8`}>
      <style>{css}</style>

      {/* Animated gradient border */}
      <div
        className="flow w-full max-w-sm rounded-2xl p-px shadow-2xl shadow-black/50"
        style={{
          background:
            'linear-gradient(110deg, #e58a3c88, #ffffff10, #f7f76a66, #ffffff10, #e58a3c88)',
          backgroundSize: '200% 100%',
        }}
      >
        <div className="relative overflow-hidden rounded-[15px] bg-[#0e151d]">
          <div className="glow pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#e58a3c]/25 blur-3xl" />

          <div className="relative px-7 py-8">
            <h1
              className={`${heading.className} rise text-3xl font-semibold tracking-tight text-white`}
              style={{ animationDelay: '0.1s' }}
            >
              Create account
            </h1>
            <p className="rise mb-6 mt-1.5 text-sm text-[#8b95a1]" style={{ animationDelay: '0.18s' }}>
              Join Deskly and start resolving tickets
            </p>

            {error && (
              <p
                key={error}
                className="shake mb-4 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-center text-sm text-red-400"
              >
                {error}
              </p>
            )}

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="rise relative" style={{ animationDelay: '0.24s' }}>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder=" "
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <label htmlFor="name" className={labelClass}>
                  Full name
                </label>
              </div>

              <div className="rise relative" style={{ animationDelay: '0.3s' }}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder=" "
                  className={`${inputClass} pr-12`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label htmlFor="email" className={labelClass}>
                  Email address
                </label>
                {emailValid && (
                  <span className="pop absolute right-4 top-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[#e58a3c]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#101820]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>

              <div className="rise" style={{ animationDelay: '0.36s' }}>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder=" "
                    className={`${inputClass} pr-12`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={(e) => setCapsOn(e.getModifierState('CapsLock'))}
                    onBlur={() => setCapsOn(false)}
                  />
                  <label htmlFor="password" className={labelClass}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8b95a1] transition-colors hover:text-[#e58a3c]"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Strength meter */}
                {password && (
                  <div className="mt-2.5">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                            i <= score ? STRENGTH_COLORS[score] : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#8b95a1]">
                      {STRENGTH_LABELS[score]}
                    </p>
                  </div>
                )}
                {capsOn && (
                  <p className="mt-2 text-xs text-[#f5b942]">Caps Lock is on</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="rise shimmer relative mt-1 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#e58a3c] to-[#f5b942] text-sm font-semibold text-[#101820] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#e58a3c]/30 active:translate-y-0 disabled:cursor-not-allowed disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                style={{ animationDelay: '0.44s' }}
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#101820]/30 border-t-[#101820]" />
                )}
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          </div>

          {/* Bottom: already have an account */}
          <div
            className="rise relative flex flex-wrap items-center justify-center gap-3 border-t border-white/10 bg-black/20 px-7 py-4"
            style={{ animationDelay: '0.52s' }}
          >
            <p className="text-xs text-[#8b95a1]">Already have an account?</p>
            <Link
              href="/login"
              className="rounded-full border border-[#e58a3c]/50 px-4 py-1.5 text-xs font-semibold text-[#e58a3c] transition-all duration-200 hover:bg-[#e58a3c] hover:text-[#101820]"
            >
              Log in
            </Link>
          </div>

          {/* Success overlay */}
          {success && (
            <div className="rise absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#0e151d]/95 backdrop-blur-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#f5b942] to-[#e58a3c]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#101820]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path className="draw" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-white">Account created. Opening your tickets…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}