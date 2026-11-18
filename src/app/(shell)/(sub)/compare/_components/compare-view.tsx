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
import {
  buildCompareHref,
  MAX_COMPARE,
} from '@/features/comparison/compare-params';
import {
  formatComparisonItemName,
  latestDate,
  orderHospitals,
} from '@/features/comparison/compare-rows';
import { useCompareStore } from '@/features/comparison/compare-store';
import { comparisonQueries } from '@/features/comparison/queries';
import { hospitalQueries } from '@/features/hospitals/queries';
import { errorMessageKey } from '@/lib/api/error-message';
import { ApiError } from '@/lib/api/errors';
import { cn } from '@/lib/utils';

import { CompareEmpty } from './compare-empty';
import { CompareHeader } from './compare-header';
import { CompareSkeleton } from './compare-skeleton';
import { CompareTable } from './compare-table';

/** 함께 공개한 항목은 많으면 100개라 처음에는 이만큼만 펼친다. */
const INITIAL_COMMON_ITEMS = 8;

const hasCode = (error: unknown, code: string) =>
  error instanceof ApiError && error.code === code;

export function CompareView({
  ykihos,
  item,
}: {
  ykihos: string[];
  item: string | null;
}) {
  const t = useTranslations('comparison');
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('common.actions');
  const tMeta = useTranslations('metadata');
  const router = useRouter();
  const regionId = useId();
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

  const hospitals = base.data
    ? orderHospitals(base.data.hospitals, ykihos)
    : [];
  const itemRow =
    baseItemRow ??
    ((activeItem &&
      selected.data?.items.find((row) => row.npayCode === activeItem)) ||
      null);
  const itemName = itemRow ? formatComparisonItemName(itemRow) : null;

  const datesQueries = useQueries({
    queries: hospitals.map((hospital) => ({
      ...hospitalQueries.itemPrices(
        hospital.ykiho,
        itemRow?.npayCode ?? '',
        itemRow?.itemName ?? '',
      ),
      enabled: itemRow != null,
      /** 보조 정보라 실패하면 다시 기다리게 하지 않고 바로 "–"로 둔다. */
      retry: false,
    })),
  });
  /** undefined는 불러오는 중, null은 날짜 없음(실패·미공개 포함)이다. */
  const dates = datesQueries.map((query) =>
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
    document.title = tMeta('titleTemplate').replace('%s', documentTitle);
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
              variant="outline"
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
        <Notice>{t('page.notice')}</Notice>
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
          itemName={itemName}
          dates={dates}
          commonItems={visibleItems}
          commonTotal={otherItems.length}
          onRemove={handleRemove}
          regionRef={regionRef}
          regionId={regionId}
        />
        <div className="flex flex-col items-center gap-2">
          {otherItems.length > INITIAL_COMMON_ITEMS && (
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
      />
      <PageContainer className="pt-2 pb-section lg:pt-4">
        {renderBody()}
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
