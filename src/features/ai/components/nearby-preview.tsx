'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { ChevronRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { withExactDistances } from '@/features/map/exact-distance';
import { defaultRadius } from '@/features/map/map-geo';
import { buildMapQuery } from '@/features/map/map-params';
import { mapQueries, type NearbyHospital } from '@/features/map/queries';
import { useDistanceLabel } from '@/features/map/use-distance-label';
import type { PriceBand } from '@/features/npay/average-verdict';
import { DEFAULT_REGION } from '@/features/regions/service-region';

import type { NearPlace } from '../area-filters';

const SHOWN = 3;
/** 서버는 약 1km로 흐린 중심에서 재므로 넉넉히 받아 정확한 중심에서 다시 잰 뒤 가까운 3곳을 고른다. */
const FETCHED = 10;

/**
 * AI가 찾은 장소 주변에서 이 항목 가격을 공개한 병원을 가까운 순으로 몇 곳 보여 준다(PostGIS 반경 검색).
 * 가격은 평균과 견줄 수 있는 범위(band) 안의 병원별 최저가라 1일당·5분 같은 다른 구성의 가격이 앞에 오지 않는다.
 */
export function NearbyPreview({
  code,
  near,
  band,
}: {
  code: string;
  near: NearPlace;
  band: PriceBand | null;
}) {
  const t = useTranslations('ai.result.near');
  const radius = defaultRadius(true);
  const query = useInfiniteQuery(
    mapQueries.nearby({
      ...near.center,
      radius,
      npayCode: code,
      band,
      size: FETCHED,
    }),
  );
  const firstPage = query.data?.pages[0];
  const hospitals = firstPage
    ? withExactDistances(firstPage.content, near.center).slice(0, SHOWN)
    : [];
  const mapHref = `/map?${buildMapQuery({
    item: code,
    region: DEFAULT_REGION,
    center: near.center,
    radius,
  })}`;

  return (
    <section className="flex flex-col gap-3 border-t border-hairline pt-4 xl:col-span-2">
      <h4 className="flex items-center gap-1.5 text-label-bold text-text-primary">
        <MapPin
          aria-hidden="true"
          className="size-4 shrink-0 text-primary-text"
          strokeWidth={1.75}
        />
        {t('title', { place: near.place, km: radius / 1000 })}
      </h4>
      {query.isPending ? (
        <ul aria-busy="true" className="flex flex-col gap-2">
          {Array.from({ length: SHOWN }, (_, index) => (
            <li key={index}>
              <Skeleton className="h-12 w-full rounded-lg" />
            </li>
          ))}
        </ul>
      ) : query.isError ? (
        <p className="text-body-sm text-text-secondary">{t('error')}</p>
      ) : hospitals.length === 0 ? (
        <p className="text-body-sm text-text-secondary">
          {t('empty', { place: near.place, km: radius / 1000 })}
        </p>
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-hairline rounded-xl bg-bg px-4">
            {hospitals.map((hospital) => (
              <li key={hospital.ykiho}>
                <NearbyRow code={code} hospital={hospital} />
              </li>
            ))}
          </ul>
          <p className="text-caption text-text-tertiary tabular-nums">
            {t('count', {
              total: firstPage?.totalElements ?? hospitals.length,
              shown: hospitals.length,
            })}
          </p>
        </>
      )}
      <Link
        href={mapHref as `/map?${string}`}
        className="inline-flex min-h-11 w-fit items-center gap-1 rounded-md text-label text-primary-text hover:underline"
      >
        {t('map')}
        <ChevronRight aria-hidden="true" className="size-4" />
      </Link>
    </section>
  );
}

function NearbyRow({
  code,
  hospital,
}: {
  code: string;
  hospital: NearbyHospital;
}) {
  const t = useTranslations('ai.result.near');
  const distance = useDistanceLabel(hospital.distanceMeters);
  const href = `/hospitals/${encodeURIComponent(hospital.ykiho)}?${new URLSearchParams({ item: code }).toString()}`;
  return (
    <Link
      href={href as `/hospitals/${string}`}
      className="flex min-h-14 items-center justify-between gap-3 py-2.5 hover:text-primary-text"
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-label-bold wrap-break-word">{hospital.name}</span>
        <span className="text-caption text-text-tertiary">
          {[hospital.className, t('distance', { distance })]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </span>
      {hospital.minPrice != null && (
        <span className="shrink-0 text-label-bold tabular-nums">
          {t('from', { amount: hospital.minPrice })}
        </span>
      )}
    </Link>
  );
}
