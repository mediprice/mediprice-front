import {
  Activity,
  ArrowRight,
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
    <section aria-labelledby="home-categories">
      <PageContainer className="space-y-6 py-section lg:space-y-8">
        <SectionHeader id="home-categories" title={t('title')} />
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4 xl:grid-cols-6 [&>li]:min-w-0">
          {tiles.map((id) => (
            <li key={id}>
              <Link
                href={{ pathname: '/search', query: { category: id } }}
                className="group flex h-full min-h-32 flex-col justify-between gap-4 rounded-2xl bg-surface p-4 transition-[background-color,scale] duration-200 ease-standard hover:bg-surface-strong active:scale-97 active:bg-primary-tint lg:min-h-40 lg:p-5"
              >
                <span
                  aria-hidden="true"
                  className="flex size-12 items-center justify-center rounded-full bg-bg text-primary-text [&_svg]:size-6 [&_svg]:[stroke-width:1.75]"
                >
                  {ICONS[id]}
                </span>
                <span className="flex items-end justify-between gap-2">
                  <span className="min-w-0 text-subheading [overflow-wrap:anywhere]">
                    {t(id)}
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-5 shrink-0 text-text-tertiary transition-transform duration-200 ease-standard group-hover:translate-x-0.5 group-hover:text-primary-text"
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
