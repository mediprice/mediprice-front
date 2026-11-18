'use client';

import { cva } from 'class-variance-authority';
import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import { useFirstView } from '@/lib/motion/use-first-view';
import { cn } from '@/lib/utils';

import { compareToAverage, hasRange, rangePosition } from './range-position';

type Size = 'md' | 'sm';

type RangeBarProps = {
  min: number | null | undefined;
  max: number | null | undefined;
  average?: number | null;
  /** 이 병원의 값. 파란 점으로 찍는다. */
  value?: number | null;
  /** 점 위 이름. 기본은 "이 병원"이다. */
  valueLabel?: string;
  /** md는 금액 라벨이 붙은 막대, sm은 목록 행의 라벨 없는 작은 막대다. */
  size?: Size;
  /** md에서 평균 라벨에 금액을 붙인다. 평균을 바로 위에 크게 쓴 곳에서는 false로 "평균"만 쓴다. */
  showAverageAmount?: boolean;
  className?: string;
};

const trackVariants = cva(
  'w-full origin-left rounded-full bg-primary-tint-pressed group-data-[phase=playing]:transition-[scale] group-data-[phase=playing]:duration-700 group-data-[phase=playing]:ease-enter group-data-[phase=waiting]:scale-x-0',
  { variants: { size: { md: 'h-2', sm: 'h-1.5' } } },
);

const markerBase =
  'absolute top-1/2 left-(--pos) -translate-1/2 group-data-[phase=playing]:transition-opacity group-data-[phase=playing]:delay-300 group-data-[phase=playing]:duration-300 group-data-[phase=waiting]:opacity-0';

const averageVariants = cva(
  cn(markerBase, 'w-0.5 rounded-full bg-text-primary'),
  { variants: { size: { md: 'h-4', sm: 'h-3' } } },
);

const valueVariants = cva(cn(markerBase, 'rounded-full bg-primary ring-bg'), {
  variants: { size: { md: 'size-4 ring-3', sm: 'size-3 ring-2' } },
});

/** 왼쪽 끝에서는 왼쪽 정렬, 오른쪽 끝에서는 오른쪽 정렬로 미끄러져 라벨이 막대 밖으로 나가지 않는다. */
const anchoredLabel =
  'absolute top-0 left-(--pos) -translate-x-(--pos) whitespace-nowrap';

function position(min: number, max: number, value: number) {
  return {
    '--pos': `${rangePosition(min, max, value) * 100}%`,
  } as CSSProperties;
}

/**
 * 최저–평균–최고 범위 막대. 범위가 없으면 그리지 않는다. 막대는 장식이고 의미는 sr-only 문장으로 전한다
 * (md는 범위와 이 병원 위치, sm은 이 병원 위치만). 처음 보일 때 왼쪽부터 그려진다.
 */
export function RangeBar({ min, max, ...props }: RangeBarProps) {
  if (min == null || max == null || !hasRange(min, max)) return null;
  return <RangeBarBody min={min} max={max} {...props} />;
}

function RangeBarBody({
  min,
  max,
  average,
  value,
  valueLabel,
  size = 'md',
  showAverageAmount = true,
  className,
}: Omit<RangeBarProps, 'min' | 'max'> & { min: number; max: number }) {
  const t = useTranslations('common.rangeBar');
  const tPrice = useTranslations('common.price');
  const [ref, phase] = useFirstView<HTMLDivElement>({ playIfVisible: true });
  const label = valueLabel ?? t('valueLabel');
  const hasAverage = average != null;
  const hasValue = value != null;

  const valueSentence = hasValue
    ? hasAverage
      ? t('valueComparison', {
          label,
          value,
          position: compareToAverage(value, average),
        })
      : t('value', { label, value })
    : null;
  const rangeSentence =
    size === 'sm'
      ? null
      : hasAverage
        ? t('rangeWithAverage', { min, max, average })
        : t('range', { min, max });

  const bar = (
    <div className="relative flex h-4 items-center">
      <div className={trackVariants({ size })} />
      {hasAverage && (
        <span
          className={averageVariants({ size })}
          style={position(min, max, average)}
        />
      )}
      {hasValue && (
        <span
          className={valueVariants({ size })}
          style={position(min, max, value)}
        />
      )}
    </div>
  );

  return (
    <div
      ref={ref}
      data-slot="range-bar"
      data-phase={phase}
      className={cn('group', className)}
    >
      {rangeSentence && <p className="sr-only">{rangeSentence}</p>}
      {valueSentence && <p className="sr-only">{valueSentence}</p>}
      {size === 'sm' ? (
        <div aria-hidden="true">{bar}</div>
      ) : (
        <div
          aria-hidden="true"
          className="flex flex-col gap-1 text-caption tabular-nums"
        >
          {hasValue && (
            <div className="relative h-5">
              <span
                className={cn(
                  anchoredLabel,
                  'text-caption-bold text-primary-text',
                )}
                style={position(min, max, value)}
              >
                {t('value', { label, value })}
              </span>
            </div>
          )}
          {bar}
          {hasAverage && (
            <div className="relative h-5">
              <span
                className={cn(
                  anchoredLabel,
                  'text-caption-strong text-text-primary',
                )}
                style={position(min, max, average)}
              >
                {showAverageAmount
                  ? t('averageAmount', { amount: average })
                  : t('average')}
              </span>
            </div>
          )}
          <div className="flex flex-wrap justify-between gap-x-3 text-text-tertiary">
            <span>{tPrice('minimum', { amount: min })}</span>
            <span className="text-right">
              {tPrice('maximum', { amount: max })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
