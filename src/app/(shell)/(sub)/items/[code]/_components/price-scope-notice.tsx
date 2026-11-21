'use client';

import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { PriceFilters } from '@/features/npay/price-filters';

import { useApplyFilters } from './use-apply-filters';

/**
 * 목록이 평균과 견줄 수 있는 가격만 담았는지 알리고 모두 보기와 오가게 한다.
 * 뺀 가격이 없으면(백엔드가 범위를 모르거나 모두 범위 안) 기본 화면에서는 그리지 않는다.
 */
export function PriceScopeNotice({
  code,
  filters,
  excludedCount,
}: {
  code: string;
  filters: PriceFilters;
  excludedCount: number;
}) {
  const t = useTranslations('items.scope');
  const applyFilters = useApplyFilters(code);
  const isAll = filters.prices === 'all';
  if (!isAll && excludedCount <= 0) return null;

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-surface-strong px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <p className="flex flex-1 gap-2 text-body-sm text-text-secondary">
        <Info
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-text-tertiary"
          strokeWidth={1.75}
        />
        <span>
          {isAll ? t('all') : t('comparable', { count: excludedCount })}{' '}
          <span className="text-text-tertiary">{t('reason')}</span>
        </span>
      </p>
      <button
        type="button"
        className="-my-1 min-h-11 shrink-0 self-end rounded-md text-label text-primary-text hover:underline sm:self-auto"
        onClick={() => {
          const { prices: _prices, ...rest } = filters;
          applyFilters(isAll ? rest : { ...filters, prices: 'all' }, {
            focusResults: true,
          });
        }}
      >
        {isAll ? t('showComparable') : t('showAll')}
      </button>
    </div>
  );
}
