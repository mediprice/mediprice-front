'use client';

import { Scale } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  buildBasketHref,
  useCompareHydrated,
  useCompareStore,
} from '@/features/comparison/compare-store';

import { CompareSkeleton } from './compare-skeleton';

/** 주소에 병원이 없을 때. 비교함에 2곳 이상 있으면 그 비교 주소로 바로 바꾸고, 아니면 고르는 방법을 안내한다. */
export function CompareEmpty() {
  const t = useTranslations('comparison.empty');
  const router = useRouter();
  const isHydrated = useCompareHydrated();
  const hospitals = useCompareStore((state) => state.hospitals);
  const basketHref =
    isHydrated && hospitals.length >= 2 ? buildBasketHref(hospitals) : null;

  useEffect(() => {
    if (basketHref) router.replace(basketHref, { scroll: false });
  }, [basketHref, router]);

  if (!isHydrated || basketHref) return <CompareSkeleton columns={2} />;

  return (
    <EmptyState
      icon={<Scale />}
      title={t('title')}
      description={t('description')}
      action={
        <Button asChild variant="tint" size="md">
          <Link href="/search">{t('search')}</Link>
        </Button>
      }
    />
  );
}
