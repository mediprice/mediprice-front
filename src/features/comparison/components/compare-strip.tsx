'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import { rangePosition } from '@/components/ui/range-position';
import { useFirstView } from '@/lib/motion/use-first-view';
import { cn } from '@/lib/utils';

import {
  assignLanes,
  groupStripMarkers,
  type StripDomain,
  type StripMarker,
} from '../compare-strip';
import { CompareNumber } from './compare-number';

const LAYOUT = {
  md: { gap: 0.11, lane: 32, stem: 8, marker: 28 },
  sm: { gap: 0.09, lane: 26, stem: 4, marker: 24 },
} as const;

/** 아래 줄의 점이 위 줄 점의 줄기를 덮도록 아래 줄을 위에 쌓는다. */
const LANE_Z = ['z-30', 'z-20', 'z-10'] as const;

const fade =
  'group-data-[phase=playing]:transition-opacity group-data-[phase=playing]:delay-300 group-data-[phase=playing]:duration-300 group-data-[phase=waiting]:opacity-0';

/** 왼쪽·오른쪽 끝에서 막대 밖으로 나가지 않고, 막대보다 길면(큰 글자) 줄을 바꾼다. */
const anchoredLabel =
  'relative left-(--pos) block w-max max-w-full -translate-x-(--pos)';

const at = (domain: StripDomain, value: number) =>
  ({
    '--pos': `${rangePosition(domain.min, domain.max, value) * 100}%`,
  }) as CSSProperties;

/**
 * 여러 병원의 가격을 막대 하나에 번호 점으로 찍는다. 가까운 점은 위 줄로 올려 겹치지 않는다.
 * 장식(aria-hidden)이고 같은 내용은 옆의 표·목록이 글자로 전한다. md는 평균·최저·최고 라벨을 붙이고, sm은 표 행용 작은 막대다.
 */
export function CompareStrip({
  domain,
  markers,
  average,
  averageLabel,
  size = 'md',
  className,
}: {
  domain: StripDomain;
  markers: readonly StripMarker[];
  average?: number | null;
  /** md에서 평균 눈금 아래 라벨("서울·경기 평균 N원"). */
  averageLabel?: string;
  size?: 'md' | 'sm';
  className?: string;
}) {
  const tPrice = useTranslations('common.price');
  const [ref, phase] = useFirstView<HTMLDivElement>({ playIfVisible: true });
  const layout = LAYOUT[size];
  const groups = groupStripMarkers(markers);
  const lanes = assignLanes(
    groups.map((marker) => rangePosition(domain.min, domain.max, marker.value)),
    layout.gap,
  );
  const laneCount = Math.max(1, ...lanes.map((lane) => lane + 1));
  const inset = size === 'md' ? 'mx-3.5' : 'mx-3';

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-slot="compare-strip"
      data-phase={phase}
      className={cn('group isolate flex flex-col', className)}
    >
      <div
        className={cn('relative h-(--strip-h)', inset)}
        style={
          {
            '--strip-h': `${(laneCount - 1) * layout.lane + layout.stem + layout.marker}px`,
          } as CSSProperties
        }
      >
        {groups.map((marker, index) => (
          <span
            key={marker.id}
            className={cn(
              'absolute bottom-0 left-(--pos) flex -translate-x-1/2 flex-col items-center',
              LANE_Z[lanes[index] ?? 0],
              fade,
            )}
            style={
              {
                ...at(domain, marker.value),
                '--stem-h': `${(lanes[index] ?? 0) * layout.lane + layout.stem}px`,
              } as CSSProperties
            }
          >
            <CompareNumber
              value={marker.numbers}
              isLowest={marker.isLowest}
              size={size}
            />
            <span
              className={cn(
                'h-(--stem-h) w-0.5',
                marker.isLowest ? 'bg-positive' : 'bg-text-primary',
              )}
            />
          </span>
        ))}
      </div>
      <div className={cn('relative', inset)}>
        <div
          className={cn(
            'w-full origin-left rounded-full bg-primary-tint-pressed group-data-[phase=playing]:transition-[scale] group-data-[phase=playing]:duration-700 group-data-[phase=playing]:ease-enter group-data-[phase=waiting]:scale-x-0',
            size === 'md' ? 'h-2' : 'h-1.5',
          )}
        />
        {average != null && (
          <span
            className={cn(
              'absolute top-1/2 left-(--pos) w-0.5 -translate-1/2 rounded-full bg-text-secondary',
              size === 'md' ? 'h-4' : 'h-3',
              fade,
            )}
            style={at(domain, average)}
          />
        )}
      </div>
      {size === 'md' && (
        <div className="mt-1 flex flex-col gap-1 text-caption tabular-nums">
          {average != null && averageLabel && (
            <div className={inset}>
              <span
                className={cn(anchoredLabel, 'text-caption-strong')}
                style={at(domain, average)}
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
      )}
    </div>
  );
}
