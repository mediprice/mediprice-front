import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
} from '@/components/layout/breadcrumb';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  CompareSummary,
  ComparisonBasis,
} from '@/features/comparison/compare-basis';
import { subjectParticle } from '@/features/comparison/compare-strip';
import type {
  ComparisonHospital,
  ComparisonItem,
} from '@/features/comparison/queries';

import { CompareSummaryPanel } from './compare-summary-panel';

/**
 * 흰 머리. 모든 병원이 같은 이름의 세부 항목을 공개했으면 그 항목으로 "3곳 중 OO병원이 가장 저렴해요"라고 쓰고 가장 높은 곳과의 차이를 붙인다.
 * 아니면 "가장 낮은 공개 가격은 OO병원이에요"라고 쓰고 어느 세부 항목의 값인지 밝힌다(같은 조건의 비교가 아니라서 "저렴"이라 하지 않는다).
 */
export function CompareHeader({
  item,
  itemName,
  count,
  summary,
  isSummaryLoading,
  itemRow,
  basis,
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
  basis: ComparisonBasis | null;
  hospitals: readonly ComparisonHospital[];
}) {
  const t = useTranslations('comparison.page');
  const plainTitle =
    count == null
      ? t('fallbackTitle')
      : itemName
        ? t('titleWithItem', { item: itemName, count })
        : t('title', { count });
  const isSame = summary?.basis === 'sameVariant';
  const sharedVariant =
    basis?.kind === 'sameVariant' ? basis.entries[0]?.variant : null;
  const sentence =
    summary == null || count == null
      ? null
      : summary.kind === 'cheapest'
        ? t(isSame ? 'summary' : 'summaryLowest', {
            count,
            name: summary.name,
            particle: subjectParticle(summary.name),
          })
        : summary.kind === 'tie'
          ? t(isSame ? 'summaryTieSame' : 'summaryTie', {
              count,
              tied: summary.tied,
            })
          : t(isSame ? 'summarySameVariant' : 'summarySame', { count });
  const basisNote =
    summary == null
      ? null
      : isSame
        ? sharedVariant
          ? t('basisSame', { variant: sharedVariant })
          : null
        : summary.kind === 'cheapest' && summary.variant
          ? t.rich('basisLowest', {
              name: summary.name,
              variant: summary.variant,
              price: summary.price,
              nb: (chunks) => (
                <span className="whitespace-nowrap tabular-nums">{chunks}</span>
              ),
            })
          : t('basisLowestUnnamed');

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
        {basisNote && (
          <p className="text-body-lg text-text-secondary">{basisNote}</p>
        )}
        {isSame && summary && summary.kind !== 'same' && summary.gap > 0 && (
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
      {summary && itemRow && basis && (
        <CompareSummaryPanel
          row={itemRow}
          basis={basis}
          hospitals={hospitals}
        />
      )}
    </PageContainer>
  );
}
