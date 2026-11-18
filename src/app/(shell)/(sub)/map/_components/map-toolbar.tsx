'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Chip } from '@/components/ui/chip';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import { RADIUS_OPTIONS, type RadiusOption } from '@/features/map/map-geo';
import { npayQueries } from '@/features/npay/queries';
import type { ServiceRegion } from '@/features/regions/service-region';

import { itemListHref } from './item-list-href';

export type MobileView = 'list' | 'map';

/** 제목(고른 항목)과 반경 칩, 모바일 지도/목록 전환. 데스크톱은 항목 가격 목록으로 돌아가는 버튼도 둔다(모바일은 상단 바가 맡는다). */
export function MapToolbar({
  item,
  region,
  radius,
  onRadiusChange,
  view,
  onViewChange,
}: {
  item: string | null;
  region: ServiceRegion;
  radius: RadiusOption;
  onRadiusChange: (radius: RadiusOption) => void;
  /** 모바일에서만 쓰는 지도/목록 전환. 데스크톱은 둘 다 보인다. */
  view: MobileView;
  onViewChange: (view: MobileView) => void;
}) {
  const t = useTranslations('map');

  return (
    <div className="border-b border-hairline bg-bg">
      <div className="flex flex-col gap-3 py-3 px-page lg:flex-row lg:flex-wrap lg:items-center lg:gap-4 lg:py-4">
        <div className="flex min-w-0 items-center gap-3">
          {item && (
            <Link
              href={itemListHref(item, region)}
              className="hidden min-h-11 shrink-0 items-center gap-1 rounded-lg bg-surface pr-3.5 pl-2.5 text-label-bold text-text-primary hover:bg-surface-strong lg:inline-flex"
            >
              <ChevronLeft
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.75}
              />
              {t('header.backToList')}
            </Link>
          )}
          <h1 className="min-w-0 flex-1 text-heading">
            {item ? <ItemTitle code={item} /> : t('header.title')}
          </h1>
          <span id="map-view-label" className="sr-only">
            {t('view.label')}
          </span>
          <SegmentedControl
            name="map-view"
            aria-labelledby="map-view-label"
            value={view}
            onValueChange={onViewChange}
            options={[
              { value: 'list', label: t('view.list') },
              { value: 'map', label: t('view.map') },
            ]}
            className="w-32 shrink-0 flex-nowrap lg:hidden"
          />
        </div>
        <div
          role="group"
          aria-label={t('radius.label')}
          className="-mx-page flex gap-2 overflow-x-auto py-1 px-page lg:mx-0 lg:px-0"
        >
          {RADIUS_OPTIONS.map((option) => (
            <Chip
              key={option}
              selected={option === radius}
              onClick={() => onRadiusChange(option)}
            >
              {t('radius.option', { km: option / 1000 })}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 항목 이름은 "대분류/중분류/세부" 경로라서 대분류를 떼고 쓴다(S-06 제목과 같은 규칙). 못 받으면 일반 제목으로 둔다. */
function ItemTitle({ code }: { code: string }) {
  const t = useTranslations('map.header');
  const { data, isPending } = useQuery(npayQueries.detail(code));
  if (isPending) {
    return (
      <>
        <span className="sr-only">{t('itemLoading')}</span>
        <Skeleton className="inline-block h-7 w-48 align-middle" />
      </>
    );
  }
  if (!data) return t('title');
  const prefix = data.mdivName ? `${data.mdivName}/` : '';
  const name =
    prefix && data.name.startsWith(prefix)
      ? data.name.slice(prefix.length)
      : data.name;
  return t('itemTitle', { item: name.split('/').join(' · ') });
}
