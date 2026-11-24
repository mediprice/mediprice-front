import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** 가격 영역 높이(평균 28px + 최저~최고 19px + 병원 수 19px + 간격). 상태가 바뀌어도 행 높이가 같게 둔다. */
export const PRICE_SLOT = 'min-h-17.5';

/** PriceOverview와 같은 줄 높이(28px·19px·19px)를 차지한다. */
export function PriceSkeleton() {
  return (
    <div className={cn('space-y-0.5', PRICE_SLOT)}>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-4.75 w-60 max-w-full" />
      <Skeleton className="h-4.75 w-20" />
    </div>
  );
}
