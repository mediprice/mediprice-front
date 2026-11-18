'use client';

import { useQuery } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { hospitalQueries } from '@/features/hospitals/queries';
import { formatLocation } from '@/features/regions/format-location';
import { errorMessageKey } from '@/lib/api/error-message';

/** 후기를 쓸 병원. 후기 화면에서는 바꿀 수 없어 잠금 표시와 함께 보여 준다. */
export function TargetHospitalCard({
  ykiho,
  fallbackName,
}: {
  ykiho: string;
  /** 병원 정보를 못 받았을 때 쓸 이름(수정할 후기에 담긴 병원 이름). */
  fallbackName?: string | null;
}) {
  const t = useTranslations('reviews.form');
  const tErrors = useTranslations('errors');
  const hospital = useQuery(hospitalQueries.detail(ykiho));
  const name = hospital.data?.name ?? fallbackName;
  const meta = hospital.data
    ? [
        hospital.data.className,
        [
          formatLocation(hospital.data.sidoName, hospital.data.sgguName),
          hospital.data.emdongName,
        ]
          .filter(Boolean)
          .join(' '),
      ]
        .filter(Boolean)
        .join(' · ')
    : null;

  return (
    <section
      aria-labelledby="review-target-title"
      className="flex items-center gap-3 rounded-xl bg-bg px-4 py-4 shadow-card lg:bg-surface lg:px-6 lg:shadow-none"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2
          id="review-target-title"
          className="text-caption text-text-secondary"
        >
          {t('target')}
        </h2>
        {name ? (
          <p className="text-heading break-keep">{name}</p>
        ) : hospital.isError ? (
          <p className="text-body text-text-secondary">
            {tErrors(errorMessageKey(hospital.error))}
          </p>
        ) : (
          <Skeleton className="h-7 w-48 max-w-full" />
        )}
        {meta && <p className="text-caption text-text-secondary">{meta}</p>}
      </div>
      <p className="flex shrink-0 flex-col items-center gap-1 text-caption text-text-secondary lg:flex-row lg:rounded-full lg:border lg:border-border lg:bg-bg lg:px-3.5 lg:py-1.5 lg:text-body-sm">
        <Lock
          aria-hidden="true"
          className="size-4 lg:hidden"
          strokeWidth={1.75}
        />
        {t('locked')}
      </p>
    </section>
  );
}
