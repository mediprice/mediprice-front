'use client';

import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { Building2, ChevronDown, CircleAlert, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section-header';
import {
  comparisonBasis,
  lowestOf,
  summarizeComparison,
} from '@/features/comparison/compare-basis';
import {
  buildCompareHref,
  MAX_COMPARE,
} from '@/features/comparison/compare-params';
import { latestDate, orderHospitals } from '@/features/comparison/compare-rows';
import { useCompareStore } from '@/features/comparison/compare-store';
import { comparisonQueries } from '@/features/comparison/queries';
import { priceRowName } from '@/features/hospitals/price-groups';
import { hospitalQueries } from '@/features/hospitals/queries';
import { comparableBand } from '@/features/npay/average-verdict';
import { formatItemPath } from '@/features/npay/item-name';
import { npayQueries } from '@/features/npay/queries';
import { DEFAULT_REGION, sidoCodesOf } from '@/features/regions/service-region';
import { errorMessageKey } from '@/lib/api/error-message';
import { ApiError } from '@/lib/api/errors';
import { cn } from '@/lib/utils';

import { BasketSyncNotice } from './basket-sync-notice';
import { CompareEmpty } from './compare-empty';
import { CompareHeader } from './compare-header';
import { CompareShare } from './compare-share';
import { CompareSkeleton } from './compare-skeleton';
import { CompareTable } from './compare-table';
import { MixedItemsNotice } from './mixed-items-notice';

/** 함께 공개한 항목은 많으면 100개라 처음에는 이만큼만 펼친다. */
const INITIAL_COMMON_ITEMS = 8;

/** 적용일은 보조 정보라 응답이 늦어도 표가 계속 불러오는 중으로 보이지 않게 이 시간 뒤에는 "–"로 둔다. */
const DATE_TIMEOUT_MS = 8000;

function withTimeout<T>(run: () => Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error('Applied date request timed out')),
      ms,
    );
    run()
      .then(resolve, reject)
      .finally(() => window.clearTimeout(timer));
  });
}

const hasCode = (error: unknown, code: string) =>
  error instanceof ApiError && error.code === code;

export function CompareView({
  ykihos,
  item,
  dropped,
}: {
  ykihos: string[];
  item: string | null;
  /** 공유 링크에서 더 이상 공개되지 않아 뺀 병원 수. */
  dropped: number;
}) {
  const t = useTranslations('comparison');
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('common.actions');
  const tMeta = useTranslations('metadata');
  const router = useRouter();
  const regionId = useId();
  const headingId = useId();
  const regionRef = useRef<HTMLDivElement>(null);
  const [isCommonExpanded, setIsCommonExpanded] = useState(false);
  const removeFromBasket = useCompareStore((state) => state.remove);
  const adoptBasket = useCompareStore((state) => state.adopt);
  const hasHospitals = ykihos.length > 0;

  const base = useQuery({
    ...comparisonQueries.table(ykihos),
    enabled: hasHospitals,
    placeholderData: keepPreviousData,
  });
  const baseItemRow = item
    ? base.data?.items.find((row) => row.npayCode === item)
    : undefined;
  /** 함께 공개한 항목(기본 응답)에 선택 항목이 있으면 한 번으로 끝내고, 없을 때만(일부 병원만 공개·100개 초과) 항목을 따로 묻는다. */
  const needsItemQuery =
    item != null && base.isSuccess && !base.isPlaceholderData && !baseItemRow;
  const selected = useQuery({
    ...comparisonQueries.table(ykihos, item ? [item] : []),
    enabled: needsItemQuery,
    placeholderData: keepPreviousData,
  });
  const isItemMissing = hasCode(selected.error, 'NPAY_ITEM_NOT_FOUND');
  const activeItem = item && !isItemMissing ? item : null;
  const error = base.error ?? (isItemMissing ? null : selected.error);
  const isPending = base.isPending || (needsItemQuery && selected.isPending);

  /** 공유받은 주소에 더 이상 공개되지 않는 병원이 섞여 있으면 그 병원만 빼고 다시 연다(전체 비교를 막지 않게). */
  const isHospitalMissing = hasCode(base.error, 'HOSPITAL_NOT_FOUND');
  const checks = useQueries({
    queries: ykihos.map((ykiho) => ({
      ...hospitalQueries.detail(ykiho),
      enabled: isHospitalMissing,
      retry: false,
    })),
  });
  const isChecking =
    isHospitalMissing && checks.some((check) => check.isPending);
  const missing =
    isHospitalMissing && !isChecking
      ? ykihos.filter(
          (_, index) =>
            hasCode(checks[index]?.error, 'HOSPITAL_NOT_FOUND') ||
            (checks[index]?.error instanceof ApiError &&
              checks[index].error.status === 404),
        )
      : [];
  const remaining = ykihos.filter((ykiho) => !missing.includes(ykiho));
  const missingKey = missing.join(',');
  useEffect(() => {
    if (!missingKey || remaining.length === 0) return;
    for (const ykiho of missingKey.split(',')) removeFromBasket(ykiho);
    router.replace(
      buildCompareHref(remaining, item, dropped + missingKey.split(',').length),
      { scroll: false },
    );
    // remaining은 missingKey에서 나온다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingKey]);

  const hospitals = base.data
    ? orderHospitals(base.data.hospitals, ykihos)
    : [];
  const itemRow =
    baseItemRow ??
    ((activeItem &&
      selected.data?.items.find((row) => row.npayCode === activeItem)) ||
      null);
  const itemName = itemRow
    ? formatItemPath(itemRow.itemName, itemRow.categoryName)
    : null;

  /** 병원별 세부 항목. 적용일과, 같은 세부 항목끼리 견줄 수 있는지 보는 데 쓴다. */
  const variantQueries = useQueries({
    queries: hospitals.map((hospital) => {
      const options = hospitalQueries.itemPrices(
        hospital.ykiho,
        itemRow?.npayCode ?? '',
        itemRow?.itemName ?? '',
      );
      return {
        ...options,
        queryFn: (
          context: Parameters<NonNullable<typeof options.queryFn>>[0],
        ) =>
          withTimeout(
            async () => options.queryFn?.(context) ?? [],
            DATE_TIMEOUT_MS,
          ),
        enabled: itemRow != null,
        /** 보조 정보라 실패하면 다시 기다리게 하지 않고 바로 "–"로 둔다. */
        retry: false,
      };
    }),
  });
  const isVariantsPending = variantQueries.some(
    (query) => query.fetchStatus === 'fetching' && !query.data,
  );
  /** 병원 상세·항목 목록과 같은 기준: 서울·경기 평균의 1/3~3배 밖 가격(시간·횟수가 다른 세부 항목)은 결론에 쓰지 않는다. */
  const regional = useQuery({
    ...npayQueries.summaryIn(
      itemRow?.npayCode ?? '',
      sidoCodesOf(DEFAULT_REGION),
    ),
    enabled: itemRow != null,
  });
  const band = comparableBand(regional.data?.avgPrice);
  const basis = itemRow
    ? comparisonBasis(
        itemRow,
        hospitals,
        variantQueries.map((query) =>
          query.data?.map((row) => ({
            name: priceRowName(row),
            price: row.price,
          })),
        ),
        band,
      )
    : null;
  /** 세부 항목을 받을 때까지(최대 DATE_TIMEOUT_MS) 결론을 미뤄, 제목이 "가장 낮은 공개 가격"에서 "가장 저렴"으로 바뀌지 않게 한다. */
  const summary =
    basis && !error && !isPending && !isVariantsPending && !regional.isLoading
      ? summarizeComparison(basis, hospitals)
      : null;

  /** undefined는 불러오는 중, null은 날짜 없음(실패·미공개 포함)이다. */
  const dates = variantQueries.map((query) =>
    query.data
      ? latestDate(query.data.map((row) => row.startDate))
      : query.fetchStatus === 'fetching'
        ? undefined
        : null,
  );

  const otherItems =
    base.data?.items.filter((row) => row.npayCode !== itemRow?.npayCode) ?? [];
  const visibleItems = isCommonExpanded
    ? otherItems
    : otherItems.slice(0, INITIAL_COMMON_ITEMS);
  const addHref = activeItem ? (`/items/${activeItem}` as const) : '/search';

  const documentTitle = itemName
    ? t('page.documentTitle', { item: itemName })
    : t('page.metaTitle');

  /** 앞 화면(항목 가격)이 바꿔 둔 제목이 남지 않도록 항목 이름이 들어간 제목으로 맞춘다. */
  useEffect(() => {
    document.title = tMeta('pageTitle', { title: documentTitle });
  }, [documentTitle, tMeta]);

  /** 공유받은 주소로 들어오면 비어 있는 비교함을 이 병원들로 채워, 병원을 더 담을 때 이어지게 한다. */
  useEffect(() => {
    if (!base.data || base.isPlaceholderData) return;
    adoptBasket(
      orderHospitals(base.data.hospitals, ykihos).map((hospital) => ({
        ykiho: hospital.ykiho,
        name: hospital.name,
        itemCode: activeItem,
      })),
    );
  }, [base.data, base.isPlaceholderData, ykihos, activeItem, adoptBasket]);

  function handleRemove(ykiho: string) {
    removeFromBasket(ykiho);
    router.replace(
      buildCompareHref(
        ykihos.filter((value) => value !== ykiho),
        item,
      ),
      { scroll: false },
    );
    regionRef.current?.focus({ preventScroll: true });
  }

  function renderBody() {
    if (!hasHospitals) return <CompareEmpty />;
    if (isHospitalMissing && (isChecking || remaining.length > 0)) {
      return <CompareSkeleton columns={ykihos.length} />;
    }
    if (hasCode(error, 'HOSPITAL_NOT_FOUND')) {
      return (
        <EmptyState
          icon={<Building2 />}
          title={tErrors('hospitalNotFound')}
          description={t('notFound.description')}
          action={
            <Button asChild variant="tint" size="md">
              <Link href={addHref}>{t('notFound.back')}</Link>
            </Button>
          }
        />
      );
    }
    if (error) {
      return (
        <EmptyState
          icon={<CircleAlert />}
          title={tErrors(errorMessageKey(error))}
          action={
            <Button
              variant="tint"
              size="md"
              isLoading={base.isFetching || selected.isFetching}
              onClick={() => {
                if (base.isError) void base.refetch();
                else void selected.refetch();
              }}
            >
              {tActions('retry')}
            </Button>
          }
        />
      );
    }
    if (isPending) return <CompareSkeleton columns={ykihos.length} />;

    return (
      <div className="flex flex-col gap-4">
        <SectionHeader
          id={headingId}
          title={t('page.sectionTitle')}
          description={t('page.notice')}
          action={<CompareShare title={documentTitle} />}
        />
        <BasketSyncNotice
          hospitals={hospitals.map((hospital) => ({
            ykiho: hospital.ykiho,
            name: hospital.name,
            itemCode: activeItem,
          }))}
        />
        {dropped > 0 && (
          <Notice>{t('page.dropped', { count: dropped })}</Notice>
        )}
        {isItemMissing && <Notice>{t('page.itemNotFound')}</Notice>}
        {hospitals.length < 2 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-warning-tint px-4 py-3 text-body-sm text-warning">
            <span className="flex items-start gap-2">
              <CircleAlert
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
                strokeWidth={1.75}
              />
              {t('page.single')}
            </span>
            <Button asChild variant="onTint" size="sm" className="lg:hidden">
              <Link href={addHref}>{t('page.addHospital')}</Link>
            </Button>
          </div>
        )}
        {hospitals.length === 2 && (
          <Button asChild variant="tint" size="md" className="w-full lg:hidden">
            <Link href={addHref}>{t('page.addHospital')}</Link>
          </Button>
        )}
        <CompareTable
          hospitals={hospitals}
          slots={MAX_COMPARE - hospitals.length}
          addHref={addHref}
          item={activeItem}
          itemRow={itemRow}
          itemLowest={basis ? lowestOf(basis.entries) : undefined}
          itemName={itemName}
          dates={dates}
          commonItems={hospitals.length < 2 ? [] : visibleItems}
          commonTotal={hospitals.length < 2 ? 0 : otherItems.length}
          onRemove={handleRemove}
          regionRef={regionRef}
          regionId={regionId}
          headingId={headingId}
        />
        <div className="flex flex-col items-center gap-2">
          {hospitals.length >= 2 &&
            otherItems.length > INITIAL_COMMON_ITEMS && (
              <Button
                variant="outline"
                size="md"
                aria-expanded={isCommonExpanded}
                aria-controls={regionId}
                onClick={() => setIsCommonExpanded((value) => !value)}
                className="w-full lg:w-auto lg:min-w-60"
              >
                {isCommonExpanded
                  ? t('common.showLess')
                  : t('common.showAll', { count: otherItems.length })}
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    'transition-transform duration-150 ease-standard',
                    isCommonExpanded && 'rotate-180',
                  )}
                />
              </Button>
            )}
          {base.data?.truncated && (
            <p className="text-caption text-text-tertiary">
              {t('common.truncated', { count: base.data.items.length })}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <CompareHeader
        item={activeItem}
        itemName={itemName}
        count={base.data && !error ? hospitals.length : null}
        summary={summary}
        isSummaryLoading={
          hasHospitals &&
          item != null &&
          (isPending || (itemRow != null && isVariantsPending)) &&
          !error
        }
        itemRow={itemRow}
        basis={basis}
        hospitals={hospitals}
      />
      <PageContainer className="flex flex-col gap-4 pt-2 pb-section md:max-w-2xl lg:max-w-page lg:pt-4">
        <MixedItemsNotice ykihos={ykihos} item={activeItem} />
        <div>{renderBody()}</div>
      </PageContainer>
    </>
  );
}

function Notice({ children }: { children: string }) {
  return (
    <p className="flex items-start gap-2 rounded-lg bg-primary-tint px-4 py-3 text-body-sm text-primary-text">
      <Info
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0"
        strokeWidth={1.75}
      />
      {children}
    </p>
  );
}
