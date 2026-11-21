'use client';

import { ArrowDown, ArrowUp, Equal, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

import { judgeAgainstAverage } from '../average-verdict';

const TAG_STYLE = {
  below: { icon: ArrowDown, tone: 'bg-positive-tint text-positive' },
  above: { icon: ArrowUp, tone: 'bg-warning-tint text-warning' },
  same: { icon: Equal, tone: 'bg-surface-strong text-text-secondary' },
  incomparable: { icon: Info, tone: 'bg-surface-strong text-text-secondary' },
} as const;

/**
 * 같은 조건 평균과의 차이 꼬리표. 색만으로 알리지 않게 아이콘과 문장을 함께 쓴다.
 * 평균의 1/3~3배 밖이면 % 대신 "구성이 달라 비교 어려움"을 쓴다(judgeAgainstAverage). 평균이 없으면 그리지 않는다.
 */
export function AverageTag({
  price,
  average,
  className,
}: {
  price: number;
  average: number | null | undefined;
  className?: string;
}) {
  const t = useTranslations('common.averageTag');
  const verdict = judgeAgainstAverage(price, average);
  if (!verdict) return null;
  const key =
    verdict.kind === 'incomparable'
      ? 'incomparable'
      : verdict.comparison.direction;
  const { icon: Icon, tone } = TAG_STYLE[key];

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-md py-1 pr-2 pl-1.5 text-caption-bold tabular-nums',
        tone,
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className="size-3.5 shrink-0"
        strokeWidth={2.25}
      />
      {verdict.kind === 'incomparable' ? (
        <>
          {t('incomparable')}
          <span className="sr-only">{t('incomparableDescription')}</span>
        </>
      ) : key === 'same' ? (
        t('same')
      ) : (
        t(key, { percent: verdict.comparison.percent })
      )}
    </span>
  );
}
