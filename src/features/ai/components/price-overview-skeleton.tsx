import { Skeleton } from '@/components/ui/skeleton';

/** PriceOverview의 세 줄(평균, 최저~최고 글자, 병원 수)과 같은 줄 높이로 자리를 잡아, 가격이 들어와도 카드가 밀리지 않는다. */
export function PriceOverviewSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-1">
      <span className="flex h-lh items-center text-price-lg">
        <Skeleton className="h-6 w-40 lg:h-7" />
      </span>
      <span className="flex h-lh items-center text-body-sm">
        <Skeleton className="h-4 w-60 max-w-full" />
      </span>
      <span className="flex h-lh items-center text-body-sm">
        <Skeleton className="h-4 w-20" />
      </span>
    </div>
  );
}
