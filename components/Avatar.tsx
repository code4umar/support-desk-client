// Round badge with the person's initials; the colour is picked from the name so it stays the same everywhere.
const PALETTE = ['#2ee6d6', '#7c5cff', '#ff9d6c', '#38bdf8', '#f472b6', '#a3e635', '#fbbf24', '#34d399'];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function initials(name?: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function Avatar({ name, size = 32 }: { name?: string | null; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        background: PALETTE[hash(name ?? '') % PALETTE.length],
        color: '#0f1726',
      }}
    >
      {initials(name)}
    </span>
  );
}
