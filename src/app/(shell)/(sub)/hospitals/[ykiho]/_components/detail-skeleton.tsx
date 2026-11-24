import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';

/** 지도·패널 격자로 화면 높이만큼 자리를 잡아, 내용이 채워질 때 푸터가 화면 안에서 밀려나지 않게 한다. */
export function DetailSkeleton() {
  const t = useTranslations('common.status');
  return (
    <div
      role="status"
      aria-busy="true"
      className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,36rem)_minmax(0,1fr)]"
    >
      <span className="sr-only">{t('loading')}</span>
      <Skeleton className="h-[36svh] min-h-60 rounded-none lg:sticky lg:top-top-nav lg:order-2 lg:h-[calc(100dvh-var(--spacing-top-nav))]" />
      <div className="min-w-0 lg:order-1">
        <div className="bg-primary-tint">
          <PageContainer className="flex flex-col gap-3 pt-6 pb-5 lg:pt-8 lg:pb-7">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-9 w-64 max-w-full" />
            <Skeleton className="h-5 w-72 max-w-full" />
            <Skeleton className="h-11 w-56 max-w-full" />
          </PageContainer>
        </div>
        <div className="flex flex-col gap-8 pt-6 px-page pb-section lg:pt-8">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-12" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
