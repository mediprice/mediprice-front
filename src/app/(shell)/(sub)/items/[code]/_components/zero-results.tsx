'use client';

import { SearchX } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

import { FilterSheet } from './filter-sheet';
import {
  clearConditions,
  countActiveFilters,
  type PriceFilters,
} from './price-filters';
import { useApplyFilters } from './use-apply-filters';

/** 결과 0건. 조건이 있으면 바꾸거나 모두 풀게 하고, 조건 없이도 0건이면 다른 항목을 찾게 한다. */
export function ZeroResults({
  code,
  filters,
}: {
  code: string;
  filters: PriceFilters;
}) {
  const t = useTranslations('items.empty');
  const applyFilters = useApplyFilters(code);

  if (countActiveFilters(filters) === 0) {
    return (
      <EmptyState
        icon={<SearchX />}
        title={t('noPriceTitle')}
        description={t('noPriceDescription')}
        action={
          <Button asChild variant="tint" size="md">
            <Link href="/search">{t('search')}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={<SearchX />}
      title={t('title')}
      description={t('description')}
      className="rounded-xl bg-bg shadow-card"
      action={
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="tint"
            size="md"
            onClick={() =>
              applyFilters(clearConditions(filters), { focusResults: true })
            }
          >
            {t('reset')}
          </Button>
          <div className="lg:hidden">
            <FilterSheet
              code={code}
              filters={filters}
              trigger={
                <Button variant="ghost" size="md">
                  {t('change')}
                </Button>
              }
            />
          </div>
        </div>
      }
    />
  );
}
