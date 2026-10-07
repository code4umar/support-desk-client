'use client';

// Light/dark switch. The theme lives on <html data-theme="..."> (set before paint by the
// inline script in layout.tsx) and is saved in localStorage, so no React state is needed.
export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* private mode: choice just won't persist */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light/dark theme"
      title="Toggle theme"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-dark/50 bg-surface text-brand-dark shadow-sm transition-all hover:border-brand hover:bg-brand/15 hover:shadow-md"
    >
      {/* sun: shown in dark mode (click to go light) */}
      <svg className="hidden h-5 w-5 dark:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="4" />
        <path strokeLinecap="round" d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
      </svg>
      {/* moon: shown in light mode (click to go dark) */}
      <svg className="block h-5 w-5 dark:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    </button>
  );
}
