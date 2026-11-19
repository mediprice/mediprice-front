import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
} from '@/components/layout/breadcrumb';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import type { HomeCategoryId } from '@/features/npay/catalog';
import { useCategoryLabel } from '@/features/npay/use-category-label';
import {
  regionQuery,
  type ServiceRegion,
} from '@/features/regions/service-region';
import type { CategoryView } from '@/features/search/category-tree';

import { categoryHref } from './category-href';
import { ChipLinks, ChipLinksSkeleton } from './chip-links';
import { KeepPhrase } from './keep-phrase';

type Crumb = {
  key: string;
  label: string;
  href: ReturnType<typeof categoryHref>;
};

/**
 * 분류 경로, 제목(쉬운 이름)과 공식 이름, 하위 분류 칩. view가 없으면(분류 목록을 불러오는 중) 같은 높이의 자리만 잡는다.
 * 모바일 경로는 이 화면에서 직접 그리고, 데스크톱은 다른 하위 화면과 같은 Breadcrumb를 쓴다.
 */
export function CategoryHeader({
  homeId,
  code,
  view,
  region,
}: {
  homeId: HomeCategoryId | undefined;
  code: string | undefined;
  view: CategoryView | undefined;
  region: ServiceRegion;
}) {
  const t = useTranslations('search');
  const label = useCategoryLabel();
  const query = (extra: Record<string, string>) => ({
    ...extra,
    ...regionQuery(region),
  });
  const scope = (scopeCode?: string) =>
    categoryHref(
      query({
        category: homeId ?? 'all',
        ...(scopeCode ? { code: scopeCode } : {}),
      }),
    );

  const crumbs: Crumb[] = [
    {
      key: 'root',
      label: t('category.root'),
      href: categoryHref(query({ category: 'all' })),
    },
    ...(homeId
      ? [{ key: homeId, label: t(`category.home.${homeId}`), href: scope() }]
      : []),
    ...(view?.trail ?? []).map((node) => ({
      key: node.code,
      label: label(node.code, node.name),
      href: scope(node.code),
    })),
  ];
  const isTitleKnown = Boolean(view) || (homeId !== undefined && !code);
  const current = isTitleKnown ? crumbs.at(-1) : undefined;
  const parents = isTitleKnown ? crumbs.slice(0, -1) : crumbs;

  return (
    <PageContainer className="space-y-1 pt-3 pb-4 lg:pt-4 lg:pb-6">
      <Breadcrumb>
        <BreadcrumbLink href="/">{t('breadcrumb.home')}</BreadcrumbLink>
        {parents.map((crumb) => (
          <BreadcrumbLink key={crumb.key} href={crumb.href}>
            <KeepPhrase text={crumb.label} />
          </BreadcrumbLink>
        ))}
        <BreadcrumbCurrent>
          {current ? (
            <KeepPhrase text={current.label} />
          ) : (
            <Skeleton className="inline-block h-5 w-20" />
          )}
        </BreadcrumbCurrent>
      </Breadcrumb>
      <nav aria-label={t('category.breadcrumb')} className="lg:hidden">
        <ol className="flex flex-wrap items-center gap-x-1 text-caption-bold text-text-secondary">
          {parents.map((crumb) => (
            <li key={crumb.key} className="flex items-center gap-1">
              <Link
                href={crumb.href}
                className="inline-flex min-h-11 items-center rounded-sm hover:text-primary-text hover:underline"
              >
                <KeepPhrase text={crumb.label} />
              </Link>
              <ChevronRight
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={1.5}
              />
            </li>
          ))}
          <li aria-current="page" className="flex min-h-11 items-center">
            {current ? (
              <KeepPhrase text={current.label} />
            ) : (
              <Skeleton className="h-4 w-16" />
            )}
          </li>
        </ol>
      </nav>

      <h1 className="flex min-h-8 items-center text-title lg:min-h-8.5">
        {current ? (
          <KeepPhrase text={current.label} />
        ) : (
          <Skeleton className="h-7 w-40" />
        )}
      </h1>
      <p className="min-h-5.75 text-body-sm text-text-secondary">
        {view ? (
          t('category.official', { names: view.scopeNames.join(', ') })
        ) : (
          <Skeleton className="h-5 w-48" />
        )}
      </p>
      <p className="text-body-sm text-text-secondary">
        {t('category.description')}
      </p>

      {!view ? (
        <ChipLinksSkeleton label={t('category.subCategories')} />
      ) : (
        view.chips.length > 0 && (
          <ChipLinks
            label={t('category.subCategories')}
            chips={[
              {
                key: 'all',
                label: t('category.all'),
                href: scope(view.parentCode),
                isSelected: !view.selectedCode,
              },
              ...view.chips.map((chip) => ({
                key: chip.code,
                label: label(chip.code, chip.name),
                href: scope(chip.code),
                isSelected: chip.code === view.selectedCode,
              })),
            ]}
          />
        )
      )}
    </PageContainer>
  );
}
