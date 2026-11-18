import type { UseQueryResult } from '@tanstack/react-query';
import {
  Activity,
  ChevronRight,
  Eye,
  ScanLine,
  Smile,
  Syringe,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
} from '@/components/layout/breadcrumb';
import { PageContainer } from '@/components/layout/page-container';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { HOME_CATEGORIES, type HomeCategoryId } from '@/features/npay/catalog';
import {
  regionQuery,
  type ServiceRegion,
} from '@/features/regions/service-region';
import { otherCategories } from '@/features/search/category-tree';
import type { components } from '@/lib/api/schema';

import { KeepPhrase } from './keep-phrase';
import { ResultsError } from './results-error';

type NpayCategory = components['schemas']['NpayCategoryResponse'];

const ICONS: Record<HomeCategoryId, ReactNode> = {
  physio: <Activity />,
  dental: <Smile />,
  eye: <Eye />,
  vaccine: <Syringe />,
  imaging: <ScanLine />,
};

const HOME_CODES = HOME_CATEGORIES.flatMap(({ categoryCodes }) => [
  ...categoryCodes,
]);

const TILE =
  'flex h-full min-h-18 items-center gap-3 rounded-xl bg-bg py-3 pr-3 pl-4 shadow-card transition-colors hover:bg-primary-tint lg:bg-surface lg:shadow-none lg:hover:bg-primary-tint';

/** 전체 분류(category=all). 홈 분야 다섯 개를 먼저 크게, 나머지 공식 대분류는 가나다순으로 보여 준다. */
export function CategoryRoot({
  categories,
  region,
}: {
  categories: UseQueryResult<NpayCategory[]>;
  region: ServiceRegion;
}) {
  const t = useTranslations('search.category');
  const tCrumb = useTranslations('search.breadcrumb');
  const others = categories.data
    ? otherCategories(categories.data, HOME_CODES)
    : undefined;

  return (
    <>
      <PageContainer className="space-y-2 pt-5 pb-4 lg:pt-4 lg:pb-6">
        <Breadcrumb>
          <BreadcrumbLink href="/">{tCrumb('home')}</BreadcrumbLink>
          <BreadcrumbCurrent>{t('root')}</BreadcrumbCurrent>
        </Breadcrumb>
        <h1 className="text-title">{t('root')}</h1>
        <p className="text-body-sm text-text-secondary">
          {t('rootDescription')}
        </p>
      </PageContainer>

      <div className="flex-1 bg-surface lg:bg-bg">
        <PageContainer className="space-y-8 pt-5 pb-section lg:pt-2">
          <section
            aria-labelledby="search-home-categories"
            className="space-y-3"
          >
            <SectionHeader id="search-home-categories" title={t('popular')} />
            <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-5 lg:gap-4">
              {HOME_CATEGORIES.map(({ id }) => (
                <li key={id}>
                  <Link
                    href={{
                      pathname: '/search',
                      query: { category: id, ...regionQuery(region) },
                    }}
                    className="flex h-full min-h-28 flex-col justify-between gap-3 rounded-xl bg-bg p-4 shadow-card transition-colors hover:bg-primary-tint lg:items-center lg:bg-surface lg:py-6 lg:shadow-none lg:hover:bg-primary-tint"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-12 items-center justify-center rounded-xl bg-primary-tint text-primary lg:bg-bg [&_svg]:size-6 [&_svg]:[stroke-width:1.75]"
                    >
                      {ICONS[id]}
                    </span>
                    <span className="text-label-bold">
                      <KeepPhrase text={t(`home.${id}`)} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="search-other-categories"
            className="space-y-3"
          >
            <SectionHeader
              id="search-other-categories"
              title={t('others')}
              className="items-center"
              action={
                others ? (
                  <span className="text-label text-text-tertiary">
                    {t('othersCount', { count: others.length })}
                  </span>
                ) : (
                  <Skeleton className="h-5 w-10" />
                )
              }
            />
            {categories.isError ? (
              <ResultsError
                error={categories.error}
                isRetrying={categories.isFetching}
                onRetry={() => void categories.refetch()}
              />
            ) : (
              <ul className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
                {others
                  ? others.map((category) => (
                      <li key={category.code}>
                        <Link
                          href={{
                            pathname: '/search',
                            query: {
                              category: 'all',
                              code: category.code,
                              ...regionQuery(region),
                            },
                          }}
                          className={TILE}
                        >
                          <span className="min-w-0 flex-1 text-label-bold">
                            {category.name}
                          </span>
                          <ChevronRight
                            aria-hidden="true"
                            className="size-5 shrink-0 text-text-tertiary"
                            strokeWidth={1.75}
                          />
                        </Link>
                      </li>
                    ))
                  : Array.from({ length: 8 }, (_, index) => (
                      <li key={index} className={TILE}>
                        <Skeleton className="h-5 w-2/3" />
                      </li>
                    ))}
              </ul>
            )}
          </section>
        </PageContainer>
      </div>
    </>
  );
}
