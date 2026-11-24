'use client';

import { cva } from 'class-variance-authority';
import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import { useFirstView } from '@/lib/motion/use-first-view';
import { hasRange, rangePosition, type RangeScale } from '@/lib/range-position';
import { cn } from '@/lib/utils';

type Size = 'md' | 'sm';

type RangeBarProps = {
  min: number | null | undefined;
  max: number | null | undefined;
  average?: number | null;
  /** 점으로 찍을 값(예: 이 병원 가격). 파란 점으로 찍는다. 점이 없는 막대는 평균이 늘 가운데라 아무것도 알려 주지 않아 받지 않는다(docs 14장). */
  value: number;
  /** 점 위 이름(예: "이 병원"). 번역한 문자열을 넘긴다. */
  valueLabel: string;
  /** md는 금액 라벨이 붙은 막대, sm은 목록 행의 라벨 없는 작은 막대다. */
  size?: Size;
  /** sm에서 평균 눈금 아래에 작은 "평균" 라벨을 붙인다. 목록에서 한 번만 켠다. */
  showAverageTick?: boolean;
  /** 값을 평균과 견준 방향. 넘기면 화면 낭독 문장에 높다·낮다를 붙이고, 비교하기 어려운 값(구성이 다른 세부 항목)이면 넘기지 않는다. */
  comparison?: 'below' | 'above' | 'same' | null;
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

function position(scale: RangeScale, value: number) {
  /** CSSProperties는 사용자 정의 속성(--pos)을 모르므로 단언한다. */
  return {
    '--pos': `${rangePosition(scale, value) * 100}%`,
  } as CSSProperties;
}

/**
 * 값이 최저–평균–최고 사이 어디인지 보여 주는 막대. 평균이 가운데인 구간별 눈금이라 극단값이 있어도 점이 퍼지고, 양 끝 라벨은 실제 최저·최고를 쓴다. 범위가 없으면 그리지 않는다. 막대는 장식이고 의미는 sr-only 문장으로 전한다
 * (md는 범위와 값 위치, sm은 값 위치만). 처음 보일 때 왼쪽부터 그려진다.
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
  valueLabel: label,
  size = 'md',
  showAverageTick = false,
  comparison,
  className,
}: Omit<RangeBarProps, 'min' | 'max'> & { min: number; max: number }) {
  const t = useTranslations('common.rangeBar');
  const tPrice = useTranslations('common.price');
  const [ref, phase] = useFirstView<HTMLDivElement>({ playIfVisible: true });
  const hasAverage = average != null;
  const scale = { min, max, average };

  const valueSentence = comparison
    ? t('valueComparison', { label, value, position: comparison })
    : t('value', { label, value });
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
          style={position(scale, average)}
        />
      )}
      <span
        className={valueVariants({ size })}
        style={position(scale, value)}
      />
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
      <p className="sr-only">{valueSentence}</p>
      {size === 'sm' ? (
        <div aria-hidden="true">
          {bar}
          {showAverageTick && hasAverage && (
            <div className="relative h-5">
              <span
                className={cn(anchoredLabel, 'text-caption text-text-tertiary')}
                style={position(scale, average)}
              >
                {t('average')}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="flex flex-col gap-1 text-caption tabular-nums"
        >
          <div className="relative h-5">
            <span
              className={cn(
                anchoredLabel,
                'text-caption-bold text-primary-text',
              )}
              style={position(scale, value)}
            >
              {t('value', { label, value })}
            </span>
          </div>
          {bar}
          {hasAverage && (
            <div className="relative h-5">
              <span
                className={cn(
                  anchoredLabel,
                  'text-caption-strong text-text-primary',
                )}
                style={position(scale, average)}
              >
                {t('averageAmount', { amount: average })}
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
