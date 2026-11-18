import { Skeleton } from '@/components/ui/skeleton';

/** PriceOverview(md)의 세 줄(평균, 작은 막대, 최저·최고·병원 수)과 같은 줄 높이로 자리를 잡아, 가격이 들어와도 카드가 밀리지 않는다. */
export function PriceOverviewSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-1.5">
      <span className="flex h-lh items-center text-price-lg">
        <Skeleton className="h-6 w-40 lg:h-7" />
      </span>
      <span className="flex h-4 items-center">
        <Skeleton className="h-1.5 w-full max-w-60 rounded-full" />
      </span>
      <span className="flex h-lh items-center text-caption">
        <Skeleton className="h-3.5 w-56 max-w-full" />
      </span>
    </div>
  );
}
