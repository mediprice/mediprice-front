'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { MAX_COMPARE } from '@/features/comparison/compare-params';
import {
  buildBasketHref,
  useCompareHydrated,
  useCompareStore,
} from '@/features/comparison/compare-store';

/** 탭 화면에는 하단 비교함이 없어서, 관심에서 담은 병원은 목록 위 띠에서 비교하러 간다. 비교함을 불러오는 일도 여기서 한다. */
export function FavoritesCompareBand() {
  const t = useTranslations('library.favorites.compare');
  const isHydrated = useCompareHydrated();
  const hospitals = useCompareStore((state) => state.hospitals);
  useEffect(() => {
    if (!useCompareStore.persist.hasHydrated()) {
      void useCompareStore.persist.rehydrate();
    }
  }, []);
  if (!isHydrated || hospitals.length === 0) return null;
  const canCompare = hospitals.length >= 2;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg bg-primary-tint px-4 py-3 text-primary-text">
      <p className="min-w-0 flex-[1_1_12rem] text-body-sm">
        <span className="text-label-bold">
          {t('count', { count: hospitals.length, max: MAX_COMPARE })}
        </span>{' '}
        {!canCompare && t('needMore')}
      </p>
      {canCompare && (
        <Button asChild variant="onTint" size="sm">
          <Link href={buildBasketHref(hospitals)}>
            {t('go')}
            <ChevronRight aria-hidden="true" />
          </Link>
        </Button>
      )}
    </div>
  );
}
