import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';

/** 실제 화면과 같은 격자(머리·연락처·본문)로 화면 높이만큼 자리를 잡아, 내용이 채워질 때 푸터가 화면 안에서 밀려나지 않게 한다. */
export function DetailSkeleton() {
  const t = useTranslations('common.status');
  return (
    <PageContainer
      role="status"
      aria-busy="true"
      className="min-h-dvh pt-6 pb-section lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-10 lg:pt-8 xl:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <span className="sr-only">{t('loading')}</span>
      <div className="flex flex-col gap-3 lg:col-start-1 lg:row-start-1">
        <Skeleton className="hidden h-5 w-56 lg:mb-2 lg:block" />
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-9 w-72 max-w-full lg:h-11" />
        <Skeleton className="h-6.5 w-80 max-w-full" />
      </div>
      <div className="mt-5 flex flex-col gap-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
        <Skeleton className="h-36 rounded-2xl" />
      </div>
      <div className="mt-8 flex flex-col gap-section lg:col-start-1 lg:row-start-2 lg:mt-10">
        <Skeleton className="h-80 rounded-3xl" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-32" />
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
