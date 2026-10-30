import { LogoMark } from '@/components/dashboard/widgets';

// The Coding Pixel </> mark on a dark navy tile. The tile stays dark in both
// themes so the light brackets and the turquoise slash always show.
export default function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1b2a4a] to-[#0f1726] shadow-lg shadow-brand/25 ring-1 ring-brand/40"
      style={{ width: size, height: size }}
    >
      <LogoMark light className="h-[58%] w-[70%]" />
    </span>
  );
}
