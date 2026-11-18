import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import type { HomeCategoryId } from '@/features/npay/catalog';
import type { CategoryView } from '@/features/search/category-tree';
import { type Region, withRegion } from '@/features/search/search-params';

import { ChipLinks } from './chip-links';

/** 분류 경로(빵부스러기), 제목, 하위 분류 칩. 칩과 경로는 모두 같은 화면의 다른 code로 가는 링크다. */
export function CategoryHeader({
  homeId,
  view,
  region,
}: {
  homeId: HomeCategoryId | undefined;
  view: CategoryView;
  region: Region;
}) {
  const t = useTranslations('search.category');
  const scopeHref = (code?: string) => ({
    pathname: '/search' as const,
    query: withRegion(
      { category: homeId ?? 'all', ...(code ? { code } : {}) },
      region,
    ),
  });
  const root = {
    key: 'root',
    label: t('root'),
    href: {
      pathname: '/search' as const,
      query: withRegion({ category: 'all' }, region),
    },
  };
  const crumbs = [
    root,
    ...(homeId
      ? [{ key: homeId, label: t(`home.${homeId}`), href: scopeHref() }]
      : []),
    ...view.trail.map((node) => ({
      key: node.code,
      label: node.name,
      href: scopeHref(node.code),
    })),
  ];
  const current = crumbs.at(-1) ?? root;

  return (
    <PageContainer className="space-y-2 pt-5 pb-4 lg:pt-10 lg:pb-6">
      <nav aria-label={t('breadcrumb')}>
        <ol className="flex flex-wrap items-center gap-x-1 text-caption-bold text-text-secondary">
          {crumbs.slice(0, -1).map((crumb) => (
            <li key={crumb.key} className="flex items-center gap-1">
              <Link
                href={crumb.href}
                className="rounded-sm py-1 hover:text-primary-text hover:underline"
              >
                {crumb.label}
              </Link>
              <ChevronRight
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={1.5}
              />
            </li>
          ))}
          <li aria-current="page" className="py-1">
            {current.label}
          </li>
        </ol>
      </nav>
      <h1 className="text-title">{current.label}</h1>
      <p className="text-body-sm text-text-secondary">{t('description')}</p>
      {view.chips.length > 0 && (
        <ChipLinks
          label={t('subCategories')}
          chips={[
            {
              key: 'all',
              label: t('all'),
              href: scopeHref(view.parentCode),
              isSelected: !view.selectedCode,
            },
            ...view.chips.map((chip) => ({
              key: chip.code,
              label: chip.name,
              href: scopeHref(chip.code),
              isSelected: chip.code === view.selectedCode,
            })),
          ]}
        />
      )}
    </PageContainer>
  );
}
