import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** 분류 목록을 불러오는 동안 칩 줄과 같은 높이를 잡는다. */
export function ChipLinksSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-2 pt-2">
      <h2 className="text-label-bold text-text-secondary">{label}</h2>
      <div className="flex gap-2 overflow-hidden py-1">
        {['w-12', 'w-20', 'w-16', 'w-20'].map((width, index) => (
          <Skeleton
            key={index}
            className={cn('h-9 shrink-0 rounded-full', width)}
          />
        ))}
      </div>
    </div>
  );
}
