import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';

/** 화면 높이만큼 자리를 잡아, 내용이 채워질 때 푸터가 화면 안에서 밀려나지 않게 한다. */
export function DetailSkeleton() {
  const t = useTranslations('common.status');
  return (
    <div role="status" aria-busy="true" className="min-h-dvh">
      <span className="sr-only">{t('loading')}</span>
      <div className="bg-primary-tint">
        <PageContainer className="flex flex-col gap-3 pt-6 pb-5 lg:pt-8 lg:pb-7">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-5 w-72 max-w-full" />
        </PageContainer>
      </div>
      <PageContainer className="flex flex-col gap-10 pt-6 pb-section lg:flex-row lg:pt-8">
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-12" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
        <Skeleton className="hidden h-48 rounded-xl lg:block lg:w-85" />
      </PageContainer>
    </div>
  );
}
