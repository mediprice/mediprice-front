'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { PriceOverview } from '@/features/npay/components/price-overview';
import { npayQueries } from '@/features/npay/queries';
import { useCategoryLabel } from '@/features/npay/use-category-label';
import { DEFAULT_REGION, sidoCodesOf } from '@/features/regions/service-region';
import type { components } from '@/lib/api/schema';

import { formatItemName } from '../item-name';
import type { TurnItem } from '../schemas';
import { PriceOverviewSkeleton } from './price-overview-skeleton';

type NpayItemDetail = components['schemas']['NpayItemDetailResponse'];

export type ItemDetail = Pick<
  NpayItemDetail,
  'code' | 'name' | 'mdivCode' | 'mdivName'
>;

/** AI는 항목 코드와 고른 이유만 주고, 이름과 가격은 항상 공개 데이터 API에서 가져온다. */
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
    <article className="flex flex-col gap-4 rounded-2xl bg-surface p-5 lg:p-6 xl:grid xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-x-8">
      <div className="flex min-w-0 flex-col gap-1">
        {detail.mdivName && (
          <p className="text-caption-strong text-text-secondary">
            {categoryLabel(detail.mdivCode, detail.mdivName)}
          </p>
        )}
        <h3 className="text-heading">{formatItemName(detail)}</h3>
        {item.reason && (
          <p className="mt-1 text-body-sm text-text-secondary">{item.reason}</p>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-label text-text-secondary">
            {t('priceLabel', { region: tRegion(DEFAULT_REGION) })}
          </p>
          {summary.isPending ? (
            <PriceOverviewSkeleton />
          ) : summary.isError ? (
            <p className="text-body-sm text-text-secondary">
              {t('priceError')}
            </p>
          ) : (
            <PriceOverview summary={summary.data} />
          )}
        </div>
        <Button asChild variant="onTint" size="md" className="w-full">
          <Link href={`/items/${encodeURIComponent(item.code)}`}>
            {t('viewPrices')}
            <ChevronRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
