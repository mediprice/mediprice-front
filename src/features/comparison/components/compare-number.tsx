import { cn } from '@/lib/utils';

/** 비교 병원의 순번(열 순서). 표 머리·요약·막대 점이 같은 번호를 써서 색이 아니라 번호로 병원을 가린다. 장식이라 숨긴다. */
export function CompareNumber({
  value,
  isLowest = false,
  size = 'md',
  className,
}: {
  /** 같은 값으로 합친 점은 "2·3"처럼 여러 번호를 받는다. */
  value: number | readonly number[];
  isLowest?: boolean;
  size?: 'md' | 'sm';
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-slot="compare-number"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border-2 px-1 text-caption-bold whitespace-nowrap tabular-nums',
        size === 'md' ? 'h-7 min-w-7' : 'h-6 min-w-6',
        isLowest
          ? 'border-positive bg-positive text-on-primary'
          : 'border-text-primary bg-bg text-text-primary',
        className,
      )}
    >
      {typeof value === 'number' ? value : value.join('·')}
    </span>
  );
}
