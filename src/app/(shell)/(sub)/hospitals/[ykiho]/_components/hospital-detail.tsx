'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Building2, CircleAlert } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { VariantSelection } from '@/features/hospitals/detail-links';
import {
  pickVariantRow,
  priceRowName,
} from '@/features/hospitals/price-groups';
import { hospitalQueries } from '@/features/hospitals/queries';
import {
  DEFAULT_REGION,
  parseServiceRegion,
} from '@/features/regions/service-region';
import { errorMessageKey } from '@/lib/api/error-message';
import { ApiError } from '@/lib/api/errors';

import { DetailSkeleton } from './detail-skeleton';
import { HospitalContact } from './hospital-contact';
import { HospitalHeader } from './hospital-header';
import { LocationSection } from './location-section';
import { OperatingSection } from './operating-section';
import { PriceList } from './price-list';
import { PriceTrend } from './price-trend';
import { ReviewSection } from './review-section';
import { SectionNav } from './section-nav';
import { SelectedItemCard } from './selected-item-card';
import {
  useItemPrices,
  usePriceTrend,
  useRegionSummary,
} from './use-item-prices';
import { useStickyError } from './use-sticky-error';

const DEFAULT_EXPECTED_ROWS = 3;

/** 선택 항목·세부 항목은 URL(item, variant, price)과 같이 움직이되, 서버 왕복 없이 history.replaceState로만 바꾼다. */
function syncItemParams(code: string | null, variant: VariantSelection | null) {
  const url = new URL(window.location.href);
  if (code) url.searchParams.set('item', code);
  else url.searchParams.delete('item');
  if (code && variant) {
    url.searchParams.set('variant', variant.name);
    if (variant.price == null) url.searchParams.delete('price');
    else url.searchParams.set('price', String(variant.price));
  } else {
    url.searchParams.delete('variant');
    url.searchParams.delete('price');
  }
  window.history.replaceState(window.history.state, '', url);
}

export function HospitalDetail({
  ykiho,
  initialItem,
  initialVariant,
  back,
}: {
  ykiho: string;
  initialItem: string | null;
  /** 항목 가격 목록의 행이 보여 준 세부 항목. 카드가 이것을 먼저 골라 목록과 같은 가격·비교 문장을 보여 준다. */
  initialVariant: VariantSelection | null;
  /** 항목 가격 화면의 검색 조건(검증됨). 처음 들어온 항목으로 돌아갈 때만 붙인다. */
  back: string | null;
}) {
  const t = useTranslations('hospitals.detail');
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('common.actions');
  const tMeta = useTranslations('metadata');
  const [item, setItem] = useState(initialItem);
  const [variant, setVariant] = useState(initialVariant);
  const [expectedRows, setExpectedRows] = useState(DEFAULT_EXPECTED_ROWS);
  const detail = useQuery(hospitalQueries.detail(ykiho));
  /** 카드가 채워지는 동안 가격 목록이 아직 그려지지 않아도 첫 페이지를 함께 받아 둔다(PriceList의 첫 조건과 같은 키). */
  useInfiniteQuery(hospitalQueries.priceList(ykiho, {}));
  const prices = useItemPrices(ykiho, item);
  const activeRow = prices.rows
    ? pickVariantRow(prices.rows, variant)
    : undefined;
  const activeVariant = activeRow ? priceRowName(activeRow) : null;
  const trend = usePriceTrend(ykiho, item, activeVariant);
  /** 목록에서 왔으면 목록의 지역 평균과 견줘 행의 꼬리표와 같은 숫자를 말한다. */
  const region =
    item != null && item === initialItem && back
      ? parseServiceRegion(new URLSearchParams(back).get('region'))
      : DEFAULT_REGION;
  const summary = useRegionSummary(item, region);
  const isCardLoading =
    item != null &&
    !prices.error &&
    (prices.isPending || (trend.isPending && !trend.error));
  /** 처음 들어올 때만 선택 카드가 다 채워진 뒤 아래 구역을 그려, 카드가 자라며 화면 안의 내용을 밀지 않게 한다. */
  const [hasSettled, setHasSettled] = useState(initialItem == null);
  if (!hasSettled && detail.data && !isCardLoading) setHasSettled(true);

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
    nextVariant: VariantSelection | null = null,
    variantCount = DEFAULT_EXPECTED_ROWS,
  ) {
    setItem(code);
    setVariant(nextVariant);
    setExpectedRows(variantCount);
    syncItemParams(code, nextVariant);
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
  if (!hospital || (!hasSettled && prices.isNamePending)) {
    return <DetailSkeleton />;
  }
  const itemHref =
    item && item === initialItem && back
      ? (`/items/${item}?${back}` as const)
      : item
        ? (`/items/${item}` as const)
        : null;

  return (
    <PageContainer className="min-h-dvh pt-6 pb-section lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-10 lg:pt-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <HospitalHeader
        hospital={hospital}
        className="lg:col-start-1 lg:row-start-1"
        itemCrumb={
          itemHref && prices.displayName
            ? { href: itemHref, name: prices.displayName }
            : null
        }
      />
      <HospitalContact
        hospital={hospital}
        className="mt-5 lg:sticky lg:top-[calc(var(--spacing-top-nav)+1.5rem)] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:self-start"
      />
      <div className="mt-8 flex min-w-0 flex-col gap-section lg:col-start-1 lg:row-start-2 lg:mt-10">
        {item && (
          <div className="flex flex-col gap-4">
            <SelectedItemCard
              item={item}
              prices={prices}
              trend={trend}
              summary={summary}
              region={region}
              activeRow={activeRow}
              expectedRows={expectedRows}
              onVariantChange={(next) => {
                setVariant(next);
                syncItemParams(item, next);
              }}
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
        {hasSettled && (
          <div className="flex flex-col gap-6 lg:gap-8">
            <SectionNav />
            <div className="flex flex-col gap-section">
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
          </div>
        )}
      </div>
    </PageContainer>
  );
}
