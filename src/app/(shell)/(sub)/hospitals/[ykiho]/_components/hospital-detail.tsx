'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, CircleAlert } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { priceRowName } from '@/features/hospitals/price-groups';
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
import { useItemPrices, usePriceTrend } from './use-item-prices';
import { useStickyError } from './use-sticky-error';

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
  back,
}: {
  ykiho: string;
  initialItem: string | null;
  /** 항목 가격 화면의 검색 조건(검증됨). 처음 들어온 항목으로 돌아갈 때만 붙인다. */
  back: string | null;
}) {
  const t = useTranslations('hospitals.detail');
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('common.actions');
  const tMeta = useTranslations('metadata');
  const [item, setItem] = useState(initialItem);
  const [variant, setVariant] = useState<string | null>(null);
  const detail = useQuery(hospitalQueries.detail(ykiho));
  const prices = useItemPrices(ykiho, item);
  const firstRow = prices.rows?.[0];
  const activeVariant = variant ?? (firstRow ? priceRowName(firstRow) : null);
  const trend = usePriceTrend(ykiho, item, activeVariant);

  const failure = useStickyError(detail.error, () => detail.refetch());
  const isNotFound =
    failure.error instanceof ApiError &&
    (failure.error.code === 'HOSPITAL_NOT_FOUND' ||
      failure.error.status === 404);
  const pageTitle = detail.data
    ? detail.data.name
    : isNotFound
      ? t('notFound.title')
      : null;

  useEffect(() => {
    if (pageTitle)
      document.title = tMeta('titleTemplate').replace('%s', pageTitle);
  }, [pageTitle, tMeta]);

  function handleSelectItem(
    code: string | null,
    nextVariant: string | null = null,
  ) {
    setItem(code);
    setVariant(nextVariant);
    syncItemParam(code);
    if (code) {
      requestAnimationFrame(() => {
        const card = document.getElementById('selected-item');
        card?.scrollIntoView({ block: 'start' });
        card?.focus({ preventScroll: true });
      });
    }
  }

  if (failure.error) {
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
            title={tErrors(errorMessageKey(failure.error))}
            action={
              <Button
                variant="outline"
                size="md"
                isLoading={failure.isRetrying}
                onClick={() => void failure.retry()}
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
  if (!hospital) return <DetailSkeleton />;
  const itemHref =
    item && item === initialItem && back
      ? (`/items/${item}?${back}` as const)
      : item
        ? (`/items/${item}` as const)
        : null;

  return (
    <>
      <HospitalHeader
        hospital={hospital}
        itemCrumb={
          itemHref && prices.displayName
            ? { href: itemHref, name: prices.displayName }
            : null
        }
      />
      <PageContainer className="flex flex-col gap-10 pt-6 pb-section lg:flex-row lg:items-start lg:pt-8">
        <div className="flex min-w-0 flex-1 flex-col gap-8 lg:gap-10">
          {item && (
            <div className="flex flex-col gap-4">
              <SelectedItemCard
                item={item}
                prices={prices}
                trend={trend}
                activeVariant={activeVariant}
                onVariantChange={setVariant}
                onClear={() => handleSelectItem(null)}
              />
              {trend.summary.kind === 'trend' && (
                <PriceTrend
                  summary={trend.summary}
                  name={activeVariant ?? prices.displayName ?? item}
                />
              )}
            </div>
          )}
          <SectionNav />
          <PriceList
            ykiho={ykiho}
            selectedItem={item}
            selectedRows={prices.rows}
            onSelect={handleSelectItem}
          />
          <OperatingSection hospital={hospital} />
          <LocationSection hospital={hospital} />
          <ReviewSection ykiho={ykiho} />
        </div>
        <ItemRail item={item} itemName={prices.displayName} />
      </PageContainer>
    </>
  );
}
