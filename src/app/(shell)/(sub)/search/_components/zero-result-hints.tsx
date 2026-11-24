'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { Building2, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { HOME_CATEGORIES } from '@/features/npay/catalog';
import {
  regionQuery,
  type ServiceRegion,
  sidoCodesOf,
} from '@/features/regions/service-region';
import { searchQueries, totalCount } from '@/features/search/queries';

import { suggestionHref } from './suggestion-href';

/**
 * 항목이 0건일 때 먼저 권할 길: 같은 말로 찾은 병원이 있으면 병원 결과, 검색어가 홈 분야 이름과 맞으면 그 분야.
 * 둘 다 없으면 아무것도 그리지 않는다.
 */
export function ZeroResultHints({
  keyword,
  region,
}: {
  keyword: string;
  region: ServiceRegion;
}) {
  const t = useTranslations('search.zeroHints');
  const tCategory = useTranslations('home.categories');
  const hospitals = useInfiniteQuery(
    searchQueries.hospitals({ keyword, sidoCodes: sidoCodesOf(region) }),
  );
  const hospitalCount = hospitals.data
    ? (totalCount(hospitals.data.pages) ?? 0)
    : 0;
  const compact = keyword.replace(/\s+/g, '');
  const category = HOME_CATEGORIES.find((entry) => {
    const label = tCategory(entry.id).replace(/\s+/g, '');
    return label
      .split('·')
      .some((part) => part.includes(compact) || compact.includes(part));
  });
  if (hospitalCount === 0 && !category) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {hospitalCount > 0 && (
        <Button asChild variant="primary" size="md">
          <Link href={suggestionHref('hospital', keyword, region)}>
            <Building2 aria-hidden="true" />
            {t('hospitals', { count: hospitalCount })}
          </Link>
        </Button>
      )}
      {category && (
        <Button asChild variant="tint" size="md">
          <Link
            href={{
              pathname: '/search',
              query: { category: category.id, ...regionQuery(region) },
            }}
          >
            <LayoutGrid aria-hidden="true" />
            {t('category', { name: tCategory(category.id) })}
          </Link>
        </Button>
      )}
    </div>
  );
}
