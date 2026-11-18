'use client';

import { Scale } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  buildBasketHref,
  useCompareStore,
} from '@/features/comparison/compare-store';

/** 주소에 병원이 없을 때. 비교함에 2곳 이상 있으면 바로 비교하는 길을 준다. */
export function CompareEmpty() {
  const t = useTranslations('comparison.empty');
  const hospitals = useCompareStore((state) => state.hospitals);

  return (
    <EmptyState
      icon={<Scale />}
      title={t('title')}
      description={t('description')}
      action={
        hospitals.length >= 2 ? (
          <>
            <Button asChild variant="tint" size="md">
              <Link href={buildBasketHref(hospitals)}>
                {t('fromBasket', { count: hospitals.length })}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="md">
              <Link href="/search">{t('search')}</Link>
            </Button>
          </>
        ) : (
          <Button asChild variant="tint" size="md">
            <Link href="/search">{t('search')}</Link>
          </Button>
        )
      }
    />
  );
}
