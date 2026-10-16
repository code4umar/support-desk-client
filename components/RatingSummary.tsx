'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Star } from '@/components/RatingStars';

// Dashboard card: average customer rating. Hides itself for people who may not see it.
export default function RatingSummary() {
  const [data, setData] = useState<{ average: number; count: number } | null>(null);

  useEffect(() => {
    api
      .getRatingSummary()
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  const rounded = Math.round(data.average);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-5">
      <div>
        <h2 className="text-sm font-semibold text-navy">Customer satisfaction</h2>
        <p className="mt-1 text-xs text-muted">
          {data.count === 0
            ? 'No ratings yet. They appear once customers rate resolved tickets.'
            : `Based on ${data.count} rating${data.count === 1 ? '' : 's'}`}
        </p>
      </div>
      {data.count > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex" aria-label={`${data.average} out of 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} filled={n <= rounded} size={22} />
            ))}
          </div>
          <span className="text-2xl font-bold">
            {data.average.toFixed(1)}
            <span className="text-sm font-normal text-muted"> / 5</span>
          </span>
        </div>
      )}
    </div>
  );
}
