'use client';
import { useEffect, useRef, useState } from 'react';
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

// public/Image.svg (naam mein capital I hai)
const LOGIN_IMAGE = '/Image.svg';

// Demo account (sirf development mein button dikhega)
const DEMO_EMAIL = 'admin@supportdesk.test';
const DEMO_PASSWORD = ''; // Yahan demo password likh do. Khali rakha to sirf email bharega.

const TICKETS_RESOLVED = 1284;

const css = `
@keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes settle { from { transform: scale(1.15); opacity: 0.5; } to { transform: scale(1); opacity: 1; } }
@keyframes drift { from { transform: scale(1.04) translate(0, 0); } to { transform: scale(1.1) translate(-1.5%, 1.5%); } }
@keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes flow { from { background-position: 0% 50%; } to { background-position: 200% 50%; } }
@keyframes glow { 0%, 100% { opacity: 0.45; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.18); } }
@keyframes shake {
  0%, 100% { transform: translateX(0); } 20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); }
}
@keyframes draw { to { stroke-dashoffset: 0; } }
@keyframes pop { 0% { transform: translateY(-50%) scale(0); opacity: 0; } 70% { transform: translateY(-50%) scale(1.25); } 100% { transform: translateY(-50%) scale(1); opacity: 1; } }
.rise { opacity: 0; animation: rise 0.65s cubic-bezier(0.2, 0.7, 0.2, 1) forwards; }
.settle { animation: settle 1.6s cubic-bezier(0.2, 0.7, 0.2, 1) forwards; }
.drift { animation: drift 16s ease-in-out infinite alternate; }
.bob { animation: bob 5s ease-in-out infinite; }
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
  .rise, .settle, .drift, .bob, .flow, .glow, .shake, .pop { animation: none !important; opacity: 1 !important; transform: none !important; }
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

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const outerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [remember, setRemember] = useState(true);
  const [success, setSuccess] = useState(false);
  const [count, setCount] = useState(0);

  const canSubmit = email.trim() !== '' && password.trim() !== '' && !loading;
  const emailValid = EMAIL_RE.test(email.trim());
  const isDev = process.env.NODE_ENV === 'development';

  // Remember me: saved email wapas bhar do
  useEffect(() => {
    try {
      const saved = localStorage.getItem('deskly_email');
      if (saved) setEmail(saved);
    } catch {}
  }, []);

  // Live counter: 0 se upar ginti
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(TICKETS_RESOLVED);
      return;
    }
    let raf = 0;
    const start = performance.now() + 1000;
    const tick = (now: number) => {
      const t = Math.min(Math.max((now - start) / 1600, 0), 1);
      setCount(Math.round(TICKETS_RESOLVED * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Mouse spotlight + 3D tilt
  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const outer = outerRef.current;
    const inner = cardRef.current;
    if (!outer || !inner) return;
    const r = inner.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    inner.style.setProperty('--mx', `${x}px`);
    inner.style.setProperty('--my', `${y}px`);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rx = (y / r.height - 0.5) * -4;
    const ry = (x / r.width - 0.5) * 5;
    outer.style.transition = 'transform 0.12s ease-out';
    outer.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  }

  function onMouseLeave() {
    const outer = outerRef.current;
    if (!outer) return;
    outer.style.transition = 'transform 0.6s ease';
    outer.style.transform = '';
  }

  function fillDemo() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError('');
    if (!DEMO_PASSWORD) passwordRef.current?.focus();
  }

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
      try {
        if (remember) localStorage.setItem('deskly_email', trimmedEmail);
        else localStorage.removeItem('deskly_email');
      } catch {}
      setSuccess(true);
      await new Promise((r) => setTimeout(r, 900));
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
    <div
      className={`${body.className} flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-6 [perspective:1200px]`}
    >
      <style>{css}</style>

      {/* Animated gradient border (yahi tilt hota hai) */}
      <div
        ref={outerRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="flow flex h-[calc(100vh-8rem)] min-h-[560px] w-full max-w-4xl rounded-2xl p-px shadow-2xl shadow-black/50 will-change-transform"
        style={{
          background:
            'linear-gradient(110deg, #e58a3c88, #ffffff10, #f7f76a66, #ffffff10, #e58a3c88)',
          backgroundSize: '200% 100%',
        }}
      >
        <div
          ref={cardRef}
          className="relative flex w-full overflow-hidden rounded-[15px] bg-[#0e151d]"
        >
          {/* Left: your picture */}
          <div className="relative hidden flex-1 overflow-hidden bg-[#101820] md:block" aria-hidden="true">
            <div className="settle absolute inset-0">
              <div
                className="drift absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${LOGIN_IMAGE})` }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e151d]/60 via-transparent to-transparent" />

            {/* Live counter */}
            <div className="rise absolute left-6 top-6" style={{ animationDelay: '0.8s' }}>
              <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                <p className={`${heading.className} text-3xl font-bold tabular-nums text-white`}>
                  {count.toLocaleString('en-US')}
                </p>
                <p className="text-[11px] text-white/60">tickets resolved this week</p>
              </div>
            </div>

            {/* Floating ticket card */}
            <div className="rise absolute bottom-6 left-6" style={{ animationDelay: '1s' }}>
              <div className="bob flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-white">Ticket #1042 resolved</p>
                  <p className="text-[11px] text-white/60">Closed by Agent 2 in 4 min</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: login panel */}
          <div className="relative flex w-full shrink-0 flex-col overflow-hidden md:w-[420px]">
            <div className="glow pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#e58a3c]/25 blur-3xl" />

            <div className="relative flex flex-1 flex-col justify-center px-8 py-10 sm:px-10">
              <h1
                className={`${heading.className} rise text-4xl font-semibold tracking-tight text-white`}
                style={{ animationDelay: '0.1s' }}
              >
                Welcome back
              </h1>
              <p className="rise mb-8 mt-1.5 text-sm text-[#8b95a1]" style={{ animationDelay: '0.18s' }}>
                Log in to manage your support tickets
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
                <div className="rise relative" style={{ animationDelay: '0.26s' }}>
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

                <div className="rise relative" style={{ animationDelay: '0.34s' }}>
                  <input
                    ref={passwordRef}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
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

                {capsOn && (
                  <p className="-mt-2 text-xs text-[#f5b942]">Caps Lock is on</p>
                )}

                <div className="rise flex items-center justify-between" style={{ animationDelay: '0.4s' }}>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-[#8b95a1]">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-3.5 w-3.5 accent-[#e58a3c]"
                    />
                    Remember me
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-[#8b95a1] transition-colors hover:text-[#e58a3c]"
                  >
                    I forgot my password
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="rise shimmer relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#e58a3c] to-[#f5b942] text-sm font-semibold text-[#101820] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#e58a3c]/30 active:translate-y-0 disabled:cursor-not-allowed disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  style={{ animationDelay: '0.46s' }}
                >
                  {loading && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#101820]/30 border-t-[#101820]" />
                  )}
                  {loading ? 'Logging in…' : 'Log in'}
                </button>

                {isDev && (
                  <button
                    type="button"
                    onClick={fillDemo}
                    className="rise -mt-1 self-center text-xs text-[#8b95a1] underline underline-offset-2 transition-colors hover:text-[#e58a3c]"
                    style={{ animationDelay: '0.5s' }}
                  >
                    Use demo account
                  </button>
                )}
              </form>
            </div>

            {/* Bottom: create account */}
            <div
              className="rise relative flex flex-wrap items-center justify-center gap-3 border-t border-white/10 bg-black/20 px-8 py-5"
              style={{ animationDelay: '0.55s' }}
            >
              <p className="text-xs text-[#8b95a1]">Don&apos;t have an account?</p>
              <Link
                href="/register"
                className="rounded-full border border-[#e58a3c]/50 px-4 py-1.5 text-xs font-semibold text-[#e58a3c] transition-all duration-200 hover:bg-[#e58a3c] hover:text-[#101820]"
              >
                Create an account
              </Link>
            </div>
          </div>

          {/* Success overlay */}
          {success && (
            <div className="rise absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#0e151d]/95 backdrop-blur-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#f5b942] to-[#e58a3c]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#101820]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path className="draw" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-white">Signed in. Opening your tickets…</p>
            </div>
          )}

          {/* Mouse spotlight */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(360px circle at var(--mx, 50%) var(--my, 30%), rgba(229,138,60,0.10), transparent 65%)',
            }}
          />
        </div>
      </div>
    </div>
  );
}