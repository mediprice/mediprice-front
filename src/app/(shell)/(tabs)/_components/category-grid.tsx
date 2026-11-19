import {
  Activity,
  ChevronRight,
  Eye,
  LayoutGrid,
  ScanLine,
  Smile,
  Syringe,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { SectionHeader } from '@/components/ui/section-header';
import { HOME_CATEGORIES, type HomeCategoryId } from '@/features/npay/catalog';

const ICONS: Record<HomeCategoryId | 'all', ReactNode> = {
  physio: <Activity />,
  dental: <Smile />,
  eye: <Eye />,
  vaccine: <Syringe />,
  imaging: <ScanLine />,
  all: <LayoutGrid />,
};

export function CategoryGrid() {
  const t = useTranslations('home.categories');
  const tiles = [...HOME_CATEGORIES.map(({ id }) => id), 'all' as const];
  return (
    <section aria-labelledby="home-categories" className="bg-surface">
      <PageContainer className="space-y-4 py-section">
        <SectionHeader id="home-categories" title={t('title')} />
        <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-6 lg:gap-4 [&>li]:min-w-0">
          {tiles.map((id) => (
            <li key={id}>
              <Link
                href={{ pathname: '/search', query: { category: id } }}
                className="flex h-full flex-col gap-3.5 rounded-xl pressable bg-bg px-3.5 py-4 shadow-card lg:items-center lg:py-6"
              >
                <span
                  aria-hidden="true"
                  className="flex size-12 items-center justify-center rounded-xl bg-primary-tint text-primary [&_svg]:size-6 [&_svg]:[stroke-width:1.75]"
                >
                  {ICONS[id]}
                </span>
                <span className="flex items-center justify-between gap-1 text-label-bold">
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    {t(id)}
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="size-5 shrink-0 text-text-tertiary lg:hidden"
                    strokeWidth={1.75}
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PageContainer>
    </section>
  );
}
