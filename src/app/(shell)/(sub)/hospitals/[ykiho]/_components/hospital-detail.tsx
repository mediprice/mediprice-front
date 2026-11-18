'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, CircleAlert } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { hospitalQueries } from '@/features/hospitals/queries';
import { errorMessageKey } from '@/lib/api/error-message';
import { ApiError } from '@/lib/api/errors';

import { DetailSkeleton } from './detail-skeleton';
import { HospitalHeader } from './hospital-header';
import { ItemRail } from './item-rail';
import { LocationSection } from './location-section';
import { OperatingSection } from './operating-section';
import { PriceList } from './price-list';
import { PriceTrend } from './price-trend';
import { ReviewSection } from './review-section';
import { SectionNav } from './section-nav';
import { SelectedItemCard } from './selected-item-card';

/** 선택 항목은 URL(item)과 같이 움직이되, 서버 왕복 없이 history.replaceState로만 바꾼다. */
function syncItemParam(code: string | null) {
  const url = new URL(window.location.href);
  if (code) url.searchParams.set('item', code);
  else url.searchParams.delete('item');
  window.history.replaceState(window.history.state, '', url);
}

export function HospitalDetail({
  ykiho,
  initialItem,
}: {
  ykiho: string;
  initialItem: string | null;
}) {
  const t = useTranslations('hospitals.detail');
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('common.actions');
  const [item, setItem] = useState(initialItem);
  const [variant, setVariant] = useState<string | null>(null);
  const detail = useQuery(hospitalQueries.detail(ykiho));

  function handleSelectItem(code: string | null) {
    setItem(code);
    setVariant(null);
    syncItemParam(code);
    if (code) {
      const card = document.getElementById('selected-item');
      card?.scrollIntoView({ block: 'start' });
      card?.focus({ preventScroll: true });
    }
  }

  if (detail.isPending) return <DetailSkeleton />;

  if (detail.isError) {
    const isNotFound =
      detail.error instanceof ApiError &&
      (detail.error.code === 'HOSPITAL_NOT_FOUND' ||
        detail.error.status === 404);
    return (
      <PageContainer className="py-section">
        <h1 className="sr-only">{t('topBarTitle')}</h1>
        {isNotFound ? (
          <EmptyState
            icon={<Building2 />}
            title={tErrors('hospitalNotFound')}
            description={t('notFound.description')}
            action={
              <Button asChild variant="tint" size="md">
                <Link href="/">{t('notFound.home')}</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<CircleAlert />}
            title={tErrors(errorMessageKey(detail.error))}
            action={
              <Button
                variant="outline"
                size="md"
                onClick={() => void detail.refetch()}
              >
                {tActions('retry')}
              </Button>
            }
          />
        )}
      </PageContainer>
    );
  }

  const hospital = detail.data;

  return (
    <>
      <HospitalHeader hospital={hospital} />
      <PageContainer className="flex flex-col gap-10 pt-6 pb-section lg:flex-row lg:items-start lg:pt-8">
        <div className="flex min-w-0 flex-1 flex-col gap-8 lg:gap-10">
          <div className="flex flex-col gap-4">
            <SelectedItemCard
              ykiho={ykiho}
              item={item}
              variant={variant}
              onVariantChange={setVariant}
              onClear={() => handleSelectItem(null)}
            />
            {item && <PriceTrend ykiho={ykiho} item={item} variant={variant} />}
          </div>
          <SectionNav />
          <PriceList
            ykiho={ykiho}
            selectedItem={item}
            onSelect={handleSelectItem}
          />
          <OperatingSection hospital={hospital} />
          <LocationSection hospital={hospital} />
          <ReviewSection ykiho={ykiho} />
        </div>
        <ItemRail item={item} />
      </PageContainer>
    </>
  );
}
