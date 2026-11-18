'use client';

import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Ref } from 'react';

import { cn } from '@/lib/utils';

const RATINGS = [1, 2, 3, 4, 5] as const;

/** 별 다섯 개로 고르는 네이티브 라디오 묶음. 화살표 키로 옮기고, 고른 별까지 채워 굵기와 함께 보여 준다. */
export function StarRatingInput({
  name,
  value,
  onChange,
  onBlur,
  labelledBy,
  describedBy,
  isInvalid,
  ref,
}: {
  name: string;
  value: number | undefined;
  onChange: (rating: number) => void;
  onBlur?: () => void;
  labelledBy: string;
  describedBy?: string;
  isInvalid?: boolean;
  ref?: Ref<HTMLInputElement>;
}) {
  const t = useTranslations('reviews.form');
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-invalid={isInvalid || undefined}
        className="-ml-1.5 flex"
      >
        {RATINGS.map((rating) => {
          const isFilled = value != null && rating <= value;
          return (
            <label
              key={rating}
              className="group relative flex size-11 cursor-pointer items-center justify-center rounded-md active:bg-surface"
            >
              <input
                ref={rating === 1 ? ref : undefined}
                type="radio"
                name={name}
                value={rating}
                checked={value === rating}
                onChange={() => onChange(rating)}
                onBlur={onBlur}
                aria-label={t('ratingOption', { rating })}
                className="peer sr-only"
              />
              <Star
                aria-hidden="true"
                strokeWidth={1.75}
                className={cn(
                  'size-8 transition-colors duration-150 ease-standard peer-focus-visible:rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring',
                  isFilled
                    ? 'fill-current text-text-primary'
                    : 'text-text-tertiary group-hover:text-text-secondary',
                )}
              />
            </label>
          );
        })}
      </div>
      <span
        aria-hidden="true"
        className={cn(
          value
            ? 'text-label-bold text-text-primary'
            : 'text-body-sm text-text-secondary',
        )}
      >
        {value ? t('ratingValue', { rating: value }) : t('ratingNone')}
      </span>
    </div>
  );
}
