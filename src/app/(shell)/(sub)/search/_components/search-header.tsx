import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import type { Region } from '@/features/search/search-params';
import { cn } from '@/lib/utils';

import { SearchForm } from './search-form';

/** 검색어를 고쳐 다시 찾는 띠. 폼은 URL이 바뀔 때마다 새로 그려야 입력값이 URL과 맞으므로 key를 준다. */
export function SearchHeader({
  type,
  keyword,
  region,
  className,
}: {
  type: 'item' | 'hospital';
  keyword: string;
  region: Region;
  className?: string;
}) {
  const t = useTranslations('search.form');
  return (
    <div
      className={cn(
        'rounded-b-4xl bg-linear-to-b from-primary-tint via-hero via-60% to-bg lg:rounded-none lg:from-hero',
        className,
      )}
    >
      <PageContainer className="py-3.5 lg:flex lg:items-center lg:justify-center lg:gap-4 lg:py-9">
        <Link
          href="/"
          className="hidden min-h-11 shrink-0 items-center gap-1 rounded-full bg-surface px-3.5 text-body-sm text-text-primary hover:bg-surface-strong lg:inline-flex"
        >
          <ChevronLeft
            aria-hidden="true"
            className="size-4"
            strokeWidth={1.75}
          />
          {t('backHome')}
        </Link>
        <SearchForm
          key={`${type}:${keyword}:${region}`}
          type={type}
          keyword={keyword}
          region={region}
        />
      </PageContainer>
    </div>
  );
}
