import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

const MAX_RATING = 5;

/** 읽기 전용 별점. 채운 별과 빈 별의 모양이 달라 색만으로 구분하지 않는다. 읽을 문구는 label로 준다. */
export function RatingStars({
  rating,
  label,
  className,
}: {
  rating: number;
  label: string;
  className?: string;
}) {
  const filled = clampRating(rating);
  return (
    <span className={cn('flex items-center gap-0.5', className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: MAX_RATING }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          strokeWidth={1.5}
          className={cn(
            'size-3.5',
            index < filled
              ? 'fill-current text-text-primary'
              : 'text-border-strong',
          )}
        />
      ))}
    </span>
  );
}

export function clampRating(rating: number) {
  return Math.min(Math.max(Math.round(rating), 0), MAX_RATING);
}
