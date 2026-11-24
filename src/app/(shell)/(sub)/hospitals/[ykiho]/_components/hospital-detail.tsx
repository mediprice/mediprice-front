'use client';

import { usePrefetchInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Building2, CircleAlert } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useRecordView } from '@/features/history/use-record-view';
import { HospitalAreaMap } from '@/features/hospitals/components/hospital-area-map';
import type { VariantSelection } from '@/features/hospitals/detail-links';
import {
  pickVariantRow,
  priceRowName,
} from '@/features/hospitals/price-groups';
import { hospitalQueries } from '@/features/hospitals/queries';
import { comparableBand } from '@/features/npay/average-verdict';
import { npayQueries } from '@/features/npay/queries';
import {
  DEFAULT_REGION,
  parseServiceRegion,
} from '@/features/regions/service-region';
import { errorMessageKey } from '@/lib/api/error-message';
import { ApiError } from '@/lib/api/errors';
import { cn } from '@/lib/utils';

import { DetailSkeleton } from './detail-skeleton';
import { HospitalHeader } from './hospital-header';
import { LocationSection } from './location-section';
import { OperatingSection } from './operating-section';
import { PriceList, priceRowKey } from './price-list';
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
  const [item, setItem] = useState(initialItem);
  const [variant, setVariant] = useState(initialVariant);
  const [expectedRows, setExpectedRows] = useState(DEFAULT_EXPECTED_ROWS);
  /** 목록에서 골랐으면 그 행. 선택 카드의 "목록으로 돌아가기"가 이 행으로 돌아온다. */
  const [listRow, setListRow] = useState<string | null>(null);
  const detail = useQuery(hospitalQueries.detail(ykiho));
  useRecordView(hospitalQueries.detail(ykiho));
  /** 선택 항목의 상세도 서버가 채우므로, 로그인했으면 항목도 최근 본 기록에 남긴다(서버 렌더 전과 같은 동작). */
  useRecordView(npayQueries.detail(item ?? ''), item != null);
  /** 카드가 채워지는 동안 가격 목록이 아직 그려지지 않아도 첫 페이지를 함께 받아 둔다(PriceList의 첫 조건과 같은 키). 구독하지 않아 이 화면이 그 상태 변화로 다시 그려지지 않는다. */
  usePrefetchInfiniteQuery(hospitalQueries.priceList(ykiho, {}));
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
  /** 들어올 때 고른 항목만 목록 맨 위에 올려 두고, 그 순서를 끝까지 지켜 목록에서 고를 때 행이 움직이지 않게 한다. */
  const [pinned, setPinned] = useState<{
    npayCode: string;
    rows: NonNullable<typeof prices.rows>;
  } | null>(null);
  if (!pinned && initialItem && item === initialItem && prices.rows) {
    setPinned({ npayCode: initialItem, rows: prices.rows });
  }

  const failure = useStickyError(detail.error, () => detail.refetch());
  const isNotFound =
    failure.error instanceof ApiError &&
    (failure.error.code === 'HOSPITAL_NOT_FOUND' ||
      failure.error.status === 404);
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
      setListRow(nextVariant ? priceRowKey(code, nextVariant) : null);
      requestAnimationFrame(() => {
        const card = document.getElementById('selected-item');
        card?.scrollIntoView({ block: 'start' });
        card?.focus({ preventScroll: true });
      });
    } else {
      setListRow(null);
    }
  }

  /** 고른 행으로 돌아가 포커스를 둔다. 행이 사라졌으면(다른 조건으로 검색) 목록 머리로 간다. */
  function returnToList(row: string | null) {
    requestAnimationFrame(() => {
      const target =
        (row &&
          document.querySelector<HTMLElement>(
            `[data-price-row="${CSS.escape(row)}"]`,
          )) ||
        document.getElementById('prices');
      target?.scrollIntoView({ block: 'center' });
      target?.focus({ preventScroll: true });
    });
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
  const itemCrumb =
    itemHref && prices.displayName
      ? { href: itemHref, name: prices.displayName }
      : null;
  /** 선택 항목 카드와 구역들. 지도가 있든 없든 같은 내용이다. */
  const sections = (
    <>
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
            onClear={() => {
              handleSelectItem(null);
              if (listRow) returnToList(listRow);
            }}
            onBackToList={listRow ? () => returnToList(listRow) : undefined}
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
        <>
          <SectionNav />
          <PriceList
            ykiho={ykiho}
            selectedItem={item}
            pinned={pinned}
            onSelect={handleSelectItem}
          />
          <OperatingSection hospital={hospital} />
          <LocationSection hospital={hospital} />
          <ReviewSection ykiho={ykiho} />
        </>
      )}
    </>
  );

  const position =
    hospital.latitude != null && hospital.longitude != null
      ? { lat: hospital.latitude, lng: hospital.longitude }
      : null;

  /** 위치를 모르면 지도 없이 머리 띠 아래 한 열로 둔다. */
  if (!position) {
    return (
      <div className="min-h-dvh">
        <HospitalHeader hospital={hospital} itemCrumb={itemCrumb} />
        <PageContainer className="flex flex-col gap-8 pt-6 pb-section md:max-w-2xl lg:max-w-page lg:gap-10 lg:pt-8 [&>*]:lg:max-w-3xl">
          {sections}
        </PageContainer>
      </div>
    );
  }

  /**
   * 지도와 함께 보는 상세. 데스크톱은 왼쪽 패널에 병원 정보, 오른쪽은 화면 끝까지 지도이고 지도는 스크롤해도 머문다.
   * 모바일은 위에 지도(항목을 골랐으면 가격이 첫 화면에 들도록 낮게), 아래에 같은 정보가 이어진다. 키보드는 본문을 먼저 지나도록 DOM은 본문이 앞이다.
   * 패널은 창 스크롤을 그대로 써서 구역 탭(SectionNav)이 그대로 동작한다.
   */
  return (
    <div className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,36rem)_minmax(0,1fr)]">
      <div className="min-w-0">
        <HospitalHeader hospital={hospital} itemCrumb={itemCrumb} />
        <div className="flex min-w-0 flex-col gap-8 pt-6 px-page pb-section lg:gap-10 lg:pt-8">
          {sections}
        </div>
      </div>
      <div
        className={cn(
          'border-b border-hairline max-lg:order-first lg:sticky lg:top-top-nav lg:h-[calc(100dvh-var(--spacing-top-nav))] lg:border-b-0 lg:border-l',
          item ? 'h-[28svh] min-h-48' : 'h-[36svh] min-h-60',
        )}
      >
        <HospitalAreaMap
          ykiho={ykiho}
          name={hospital.name}
          position={position}
          itemCode={item}
          band={comparableBand(summary.data?.avgPrice)}
          directionsQuery={hospital.address?.trim() || hospital.name}
        />
      </div>
    </div>
  );
}
