'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import { rangePosition, type RangeScale } from '@/components/ui/range-position';
import { useFirstView } from '@/lib/motion/use-first-view';
import { cn } from '@/lib/utils';

import {
  clusterStripMarkers,
  type StripDomain,
  type StripMarker,
} from '../compare-strip';
import { CompareNumber } from './compare-number';

/** 이보다 가까운 점(막대 폭 대비)은 번호를 합친 점 하나로 묶는다. */
const MIN_GAP = 0.11;
const STEM_PX = 8;
const MARKER_PX = 28;

const fade =
  'group-data-[phase=playing]:transition-opacity group-data-[phase=playing]:delay-300 group-data-[phase=playing]:duration-300 group-data-[phase=waiting]:opacity-0';

/** 왼쪽·오른쪽 끝에서 막대 밖으로 나가지 않고, 막대보다 길면(큰 글자) 줄을 바꾼다. */
const anchoredLabel =
  'relative left-(--pos) block w-max max-w-full -translate-x-(--pos)';

const at = (position: number) =>
  ({ '--pos': `${position * 100}%` }) as CSSProperties;

/**
 * 여러 병원의 가격을 막대 하나에 번호 점으로 찍는다. 가까운 점은 위로 쌓지 않고 "2·3"처럼 번호를 합친 점 하나로 둔다.
 * 장식(aria-hidden)이고 같은 내용은 옆의 목록이 글자로 전한다. 평균·최저·최고 라벨을 붙인다.
 */
export function CompareStrip({
  domain,
  markers,
  average,
  averageLabel,
  className,
}: {
  domain: StripDomain;
  markers: readonly StripMarker[];
  average?: number | null;
  /** 평균 눈금 아래 라벨("서울·경기 평균 N원"). */
  averageLabel?: string;
  className?: string;
}) {
  const tPrice = useTranslations('common.price');
  const [ref, phase] = useFirstView<HTMLDivElement>({ playIfVisible: true });
  const scale: RangeScale = { ...domain, average };
  const clusters = clusterStripMarkers(
    markers,
    markers.map((marker) => rangePosition(scale, marker.value)),
    MIN_GAP,
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-slot="compare-strip"
      data-phase={phase}
      className={cn('group isolate flex flex-col', className)}
    >
      <div
        className="relative mx-3.5 h-(--strip-h)"
        style={{ '--strip-h': `${STEM_PX + MARKER_PX}px` } as CSSProperties}
      >
        {clusters.map((cluster) => (
          <span
            key={cluster.id}
            className={cn('absolute inset-y-0 left-(--pos) w-0', fade)}
            style={at(cluster.position)}
          >
            {/** 합친 번호는 넓어서 양 끝에서는 막대 안쪽으로 밀고, 줄기만 정확한 자리에 둔다. */}
            <CompareNumber
              value={cluster.numbers}
              isLowest={cluster.isLowest}
              className="absolute top-0 left-0 -translate-x-(--pos)"
            />
            <span
              className={cn(
                'absolute bottom-0 left-0 h-2 w-0.5 -translate-x-1/2',
                cluster.isLowest ? 'bg-positive' : 'bg-primary',
              )}
            />
          </span>
        ))}
      </div>
      <div className="relative mx-3.5">
        <div className="h-2 w-full origin-left rounded-full bg-primary-tint-pressed group-data-[phase=playing]:transition-[scale] group-data-[phase=playing]:duration-700 group-data-[phase=playing]:ease-enter group-data-[phase=waiting]:scale-x-0" />
        {average != null && (
          <span
            className={cn(
              'absolute top-1/2 left-(--pos) h-4 w-0.5 -translate-1/2 rounded-full bg-text-secondary',
              fade,
            )}
            style={at(rangePosition(scale, average))}
          />
        )}
      </div>
      <div className="mt-1 flex flex-col gap-1 text-caption tabular-nums">
        {average != null && averageLabel && (
          <div className="mx-3.5">
            <span
              className={cn(anchoredLabel, 'text-caption-strong')}
              style={at(rangePosition(scale, average))}
            >
              {averageLabel}
            </span>
          </div>
        )}
        <div className="flex justify-between gap-3 text-text-tertiary">
          <span>{tPrice('minimum', { amount: domain.min })}</span>
          <span className="text-right">
            {tPrice('maximum', { amount: domain.max })}
          </span>
        </div>
      </div>
    </div>
  );
}
