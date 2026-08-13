import React from 'react';
import { Star } from 'lucide-react';

interface Props {
  rating: number;
  maxRating?: number;
  showNumber?: boolean;
}

export function SupplierRatingStars({ rating, maxRating = 5, showNumber = true }: Props) {
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < full ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-100'}
        />
      ))}
      {showNumber && <span className="text-[11px] font-bold text-brand-text-primary ml-1">{rating.toFixed(1)}</span>}
    </span>
  );
}
