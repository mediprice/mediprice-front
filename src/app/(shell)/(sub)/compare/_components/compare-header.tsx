import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
} from '@/components/layout/breadcrumb';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import {
  type CompareSummary,
  subjectParticle,
} from '@/features/comparison/compare-strip';
import type {
  ComparisonHospital,
  ComparisonItem,
} from '@/features/comparison/queries';

import { CompareSummaryPanel } from './compare-summary-panel';

/** 흰 머리. 선택 항목에서 결론을 낼 수 있으면 제목을 "3곳 중 OO병원이 가장 저렴해요" 같은 문장으로, 그 아래 가장 높은 곳과의 차이를 쓰고 요약 묶음을 붙인다. */
export function CompareHeader({
  item,
  itemName,
  count,
  summary,
  isSummaryLoading,
  itemRow,
  hospitals,
}: {
  item: string | null;
  itemName: string | null;
  /** 불러오기 전이거나 실패하면 null이고, 제목은 "병원 비교"가 된다. */
  count: number | null;
  summary: CompareSummary | null;
  /** 항목을 골라 왔고 표를 불러오는 중이면 요약 자리를 미리 잡는다. */
  isSummaryLoading: boolean;
  itemRow: ComparisonItem | null;
  hospitals: readonly ComparisonHospital[];
}) {
  const t = useTranslations('comparison.page');
  const plainTitle =
    count == null
      ? t('fallbackTitle')
      : itemName
        ? t('titleWithItem', { item: itemName, count })
        : t('title', { count });
  const sentence =
    summary == null || count == null
      ? null
      : summary.kind === 'cheapest'
        ? t('summary', {
            count,
            name: summary.name,
            particle: subjectParticle(summary.name),
          })
        : summary.kind === 'tie'
          ? t('summaryTie', { count, tied: summary.tied })
          : t('summarySame', { count });

  return (
    <PageContainer className="flex flex-col gap-6 pt-6 pb-8 lg:pt-8 lg:pb-12">
      <div className="flex flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbLink href="/">{t('breadcrumbHome')}</BreadcrumbLink>
          {item && itemName && (
            <BreadcrumbLink href={`/items/${item}`}>{itemName}</BreadcrumbLink>
          )}
          <BreadcrumbCurrent>{t('breadcrumbCurrent')}</BreadcrumbCurrent>
        </Breadcrumb>
        {sentence && itemName && count != null && (
          <p className="text-label-bold text-primary-text">
            {t('eyebrow', { item: itemName, count })}
          </p>
        )}
        <h1 className="text-display text-balance">{sentence ?? plainTitle}</h1>
        {summary && summary.kind !== 'same' && summary.gap > 0 && (
          <p className="text-body-lg text-text-secondary">
            {t.rich('gap', {
              amount: summary.gap,
              nb: (chunks) => (
                <span className="whitespace-nowrap tabular-nums">{chunks}</span>
              ),
            })}
          </p>
        )}
        <p className="flex items-center gap-1.5 text-body-sm text-text-tertiary">
          <Info
            aria-hidden="true"
            className="size-4 shrink-0"
            strokeWidth={1.75}
          />
          {t('source')}
        </p>
      </div>
      {isSummaryLoading && (
        <Skeleton className="h-64 w-full rounded-3xl lg:h-56" />
      )}
      {summary && itemRow && (
        <CompareSummaryPanel row={itemRow} hospitals={hospitals} />
      )}
    </PageContainer>
  );
}
