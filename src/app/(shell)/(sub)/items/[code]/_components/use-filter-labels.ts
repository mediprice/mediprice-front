'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { institutionQueries } from '@/features/institutions/queries';
import { regionQueries } from '@/features/regions/queries';

import { type PriceFilters, sidoCodeOf } from './price-filters';

/** 필터 값(코드)을 화면 이름으로 바꾼다. 목록을 불러오기 전에는 이름이 undefined다. */
export function useFilterLabels(filters: PriceFilters) {
  const t = useTranslations('items');
  const sidoCode = sidoCodeOf(filters.region);
  const { data: sgguList } = useQuery({
    ...regionQueries.sggu(sidoCode ?? ''),
    enabled: sidoCode !== undefined && filters.sggu !== undefined,
  });
  const { data: institutionTypes } = useQuery({
    ...institutionQueries.types(),
    enabled: filters.institution !== undefined,
  });

  const region = t(`regions.${filters.region}`);
  const sggu = sgguList?.find((item) => item.code === filters.sggu)?.name;
  const institution = institutionTypes?.find(
    (item) => item.code === filters.institution,
  )?.name;
  const area = sggu ? t('summary.regionWithSggu', { region, sggu }) : region;
  const scope = institution
    ? t('summary.scopeWithInstitution', { scope: area, institution })
    : area;

  return { region, sggu, institution, scope };
}
