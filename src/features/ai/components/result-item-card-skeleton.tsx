import { Skeleton } from '@/components/ui/skeleton';

import { PriceOverviewSkeleton } from './price-overview-skeleton';

/** 이름을 받는 중인 후보의 자리. ResultItemCard와 같은 면·여백·줄 높이를 써서 카드가 들어와도 목록이 크게 밀리지 않는다. */
export function ResultItemCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-4 rounded-2xl bg-surface p-5 lg:p-6 xl:grid xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-x-8"
    >
      <div className="flex flex-col gap-1">
        <span className="flex h-lh items-center text-caption-strong">
          <Skeleton className="h-3.5 w-20" />
        </span>
        <span className="flex h-lh items-center text-heading">
          <Skeleton className="h-5 w-44" />
        </span>
        <span className="mt-1 flex h-lh items-center text-body-sm">
          <Skeleton className="h-4 w-full max-w-72" />
        </span>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="flex h-lh items-center text-label">
            <Skeleton className="h-4 w-24" />
          </span>
          <PriceOverviewSkeleton />
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
