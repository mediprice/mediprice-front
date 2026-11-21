import { getTranslations } from 'next-intl/server';

import { PageContainer } from '@/components/layout/page-container';
import { SubTopBar } from '@/components/layout/sub-top-bar';
import { Skeleton } from '@/components/ui/skeleton';

/** 서버가 가격 요약과 첫 목록을 읽는 동안 같은 배치의 뼈대를 바로 보여 준다(누른 뒤 화면이 멈춘 것처럼 보이지 않게). */
export default async function ItemPriceLoading() {
  const [t, tStatus] = await Promise.all([
    getTranslations('items'),
    getTranslations('common.status'),
  ]);
  return (
    <>
      <SubTopBar title={t('topBar.title')} backHref="/" />
      <div role="status" aria-busy="true" className="flex flex-1 flex-col">
        <span className="sr-only">{tStatus('loading')}</span>
        <div className="rounded-b-4xl bg-primary-tint lg:rounded-none">
          <PageContainer className="flex flex-col gap-3 py-6 lg:py-10">
            <Skeleton className="h-5 w-40 max-w-full" />
            <Skeleton className="h-9 w-56 max-w-full lg:h-10" />
            <Skeleton className="h-5 w-64 max-w-full" />
            <Skeleton className="mt-2 h-28 rounded-xl lg:hidden" />
          </PageContainer>
        </div>
        <div className="flex-1 bg-surface">
          <PageContainer className="flex flex-col gap-4 pt-4 pb-section lg:flex-row lg:items-start lg:gap-8 lg:pt-8">
            <Skeleton className="hidden h-96 w-70 shrink-0 rounded-xl lg:block" />
            <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-6">
              <Skeleton className="hidden h-28 rounded-xl lg:block" />
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-36 rounded-xl" />
              ))}
            </div>
          </PageContainer>
        </div>
      </div>
    </>
  );
}
