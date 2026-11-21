'use client';

import { useQuery } from '@tanstack/react-query';
import { SearchX } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  clearConditions,
  type PriceFilters,
  withRegion,
} from '@/features/npay/price-filters';
import { npayQueries } from '@/features/npay/queries';

import { FilterSheet } from './filter-sheet';
import { useApplyFilters } from './use-apply-filters';

/**
 * 결과 0건. 지역이 좁으면 먼저 전국으로 넓혀 보게 하고, 다른 조건이 있으면 바꾸거나 모두 풀게 한다.
 * 전국에도 없으면 같은 분류의 다른 항목으로 이어 준다(빈 검색 화면으로 보내지 않는다).
 */
export function ZeroResults({
  code,
  filters,
}: {
  code: string;
  filters: PriceFilters;
}) {
  const t = useTranslations('items.empty');
  const tRegion = useTranslations('common.region');
  const applyFilters = useApplyFilters(code);
  const detail = useQuery(npayQueries.detail(code));
  const isNationwide = filters.region === 'all';
  /** 시군구·종별로 좁혔으면 그 조건부터 풀게 하고, 지역만 골랐으면 지역을 넓히게 한다. */
  const isNarrowed = Boolean(filters.sggu || filters.institution);
  const widen = (
    <Button
      variant="tint"
      size="md"
      onClick={() =>
        applyFilters(withRegion(filters, 'all'), { focusResults: true })
      }
    >
      {t('nationwide')}
    </Button>
  );

  if (!isNarrowed) {
    const category = detail.data?.mdivCode;
    return (
      <EmptyState
        icon={<SearchX />}
        title={
          isNationwide
            ? t('noPriceTitle')
            : t('noPriceInRegion', { region: tRegion(filters.region) })
        }
        description={
          isNationwide ? t('noPriceDescription') : t('widenDescription')
        }
        className="rounded-xl bg-bg shadow-card"
        action={
          isNationwide ? (
            <Button asChild variant="tint" size="md">
              <Link
                href={
                  category
                    ? { pathname: '/search', query: { code: category } }
                    : '/search'
                }
              >
                {category ? t('sameCategory') : t('search')}
              </Link>
            </Button>
          ) : (
            widen
          )
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
