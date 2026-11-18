'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PriceOverview } from '@/features/npay/components/price-overview';
import { npayQueries } from '@/features/npay/queries';
import { useCategoryLabel } from '@/features/npay/use-category-label';
import { DEFAULT_REGION, sidoCodesOf } from '@/features/regions/service-region';
import type { components } from '@/lib/api/schema';

import { formatItemName } from '../item-name';
import type { TurnItem } from '../schemas';

type NpayItemDetail = components['schemas']['NpayItemDetailResponse'];

export type ItemDetail = Pick<
  NpayItemDetail,
  'code' | 'name' | 'mdivCode' | 'mdivName'
>;

/** AI는 항목 코드만 고르고, 이름과 가격은 항상 공개 데이터 API에서 가져온다. 이름을 찾은 항목만 카드로 보여 준다. */
export function ResultItemCard({
  item,
  detail,
}: {
  item: TurnItem;
  detail: ItemDetail;
}) {
  const t = useTranslations('ai.result');
  const tRegion = useTranslations('common.region');
  const categoryLabel = useCategoryLabel();
  const summary = useQuery(
    npayQueries.summaryIn(item.code, sidoCodesOf(DEFAULT_REGION)),
  );

  return (
    <article className="flex flex-col gap-3 rounded-xl bg-bg p-4 shadow-card lg:flex-row lg:items-end lg:gap-6 lg:p-5">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {detail.mdivName && (
          <p className="text-caption-strong text-primary-text">
            {categoryLabel(detail.mdivCode, detail.mdivName)}
          </p>
        )}
        <h3 className="text-heading">{formatItemName(detail)}</h3>
        <p className="text-body-sm text-text-secondary">{item.reason}</p>
        <div className="mt-2 flex flex-col gap-0.5">
          <p className="text-caption-strong text-text-tertiary">
            {t('priceLabel', { region: tRegion(DEFAULT_REGION) })}
          </p>
          {summary.isPending ? (
            <span className="flex flex-col gap-1.5">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-4 w-48" />
            </span>
          ) : summary.isError ? (
            <p className="text-body-sm text-text-tertiary">{t('priceError')}</p>
          ) : (
            <PriceOverview summary={summary.data} />
          )}
        </div>
      </div>
      <Button asChild variant="tint" size="md" className="w-full lg:w-auto">
        <Link href={`/items/${encodeURIComponent(item.code)}`}>
          {t('viewPrices')}
          <ChevronRight aria-hidden="true" />
        </Link>
      </Button>
    </article>
  );
}
