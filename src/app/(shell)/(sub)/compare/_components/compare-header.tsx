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
 * 비교 머리. 선택 항목이 있으면 제목 아래 요약 카드를 둔다. 모든 병원이 같은 이름의 세부 항목을 공개했으면 "3곳 중 OO병원이 가장 저렴해요"와 가장 높은 곳과의 차이를,
 * 아니면 "가장 낮은 공개 가격은 OO병원이에요"와 어느 세부 항목의 값인지를 쓴다(같은 조건의 비교가 아니라서 "저렴"이라 하지 않는다).
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
  const title =
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
    <div className="bg-primary-tint">
      <PageContainer className="flex flex-col gap-2.5 pt-6 pb-5 md:max-w-2xl lg:max-w-page lg:pt-6 lg:pb-8">
        <Breadcrumb>
          <BreadcrumbLink href="/">{t('breadcrumbHome')}</BreadcrumbLink>
          {item && itemName && (
            <BreadcrumbLink href={`/items/${item}`}>{itemName}</BreadcrumbLink>
          )}
          <BreadcrumbCurrent>{t('breadcrumbCurrent')}</BreadcrumbCurrent>
        </Breadcrumb>
        <h1 className="text-display">{title}</h1>
        <p className="flex items-center gap-1.5 text-body-sm text-text-tertiary">
          <Info
            aria-hidden="true"
            className="size-4 shrink-0"
            strokeWidth={1.75}
          />
          {t('source')}
        </p>
        {isSummaryLoading && (
          <Skeleton className="mt-2.5 h-64 w-full rounded-xl lg:h-56" />
        )}
        {summary && sentence && itemRow && basis && (
          <CompareSummaryPanel
            row={itemRow}
            basis={basis}
            hospitals={hospitals}
            sentence={sentence}
            basisNote={basisNote}
            gap={
              isSame && summary.kind !== 'same' && summary.gap > 0
                ? t.rich('gap', {
                    amount: summary.gap,
                    nb: (chunks) => (
                      <span className="whitespace-nowrap tabular-nums">
                        {chunks}
                      </span>
                    ),
                  })
                : null
            }
          />
        )}
      </PageContainer>
    </div>
  );
}
