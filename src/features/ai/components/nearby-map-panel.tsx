'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { ChevronRight, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DirectionsButton } from '@/features/hospitals/components/directions-button';
import { toTelHref } from '@/features/hospitals/detail-links';
import { LazyHospitalMap } from '@/features/map/components/lazy-hospital-map';
import type { MapMarker } from '@/features/map/components/marker-icon';
import { withExactDistances } from '@/features/map/exact-distance';
import { defaultRadius } from '@/features/map/map-geo';
import { buildMapQuery } from '@/features/map/map-params';
import { mapQueries, type NearbyHospital } from '@/features/map/queries';
import { useDistanceLabel } from '@/features/map/use-distance-label';
import type { PriceBand } from '@/features/npay/average-verdict';
import { DEFAULT_REGION } from '@/features/regions/service-region';
import { cn } from '@/lib/utils';

import type { NearPlace } from '../area-filters';

const SHOWN = 5;
/** 서버는 약 1km로 흐린 중심에서 재므로 넉넉히 받아 정확한 중심에서 다시 잰 뒤 가까운 곳을 고른다. */
const FETCHED = 15;
const PLACE_MARKER_ID = 'place';
/** 지도는 보여 주는 병원이 모두 들어오는 만큼만 넓힌다. 너무 좁으면 동네가 안 보여 최소 폭을 둔다. */
const MIN_VIEW_RADIUS = 700;

const rowId = (ykiho: string) => `near-${ykiho}`;

/**
 * AI가 찾은 장소 주변 병원을 지도(네이버 지도, 기준 장소 핀과 병원 점)와 목록으로 함께 보여 준다. 반경 검색은 PostGIS다.
 * 목록이 중심이다: 병원 이름·거리·주소와 길찾기·전화를 먼저 두고, 가격은 평균과 견줄 수 있는 범위의 병원별 최저가를 곁들인다.
 */
export function NearbyMapPanel({
  code,
  itemName,
  near,
  band,
}: {
  code: string;
  itemName: string;
  near: NearPlace;
  band: PriceBand | null;
}) {
  const t = useTranslations('ai.result.near');
  const radius = defaultRadius(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
  const hospitals = useMemo(
    () =>
      firstPage
        ? withExactDistances(firstPage.content, near.center).slice(0, SHOWN)
        : [],
    [firstPage, near.center],
  );
  const view = useMemo(() => {
    const farthest = hospitals.at(-1)?.distanceMeters ?? 0;
    return {
      center: near.center,
      radius: Math.min(radius, Math.max(MIN_VIEW_RADIUS, farthest * 1.2)),
    };
  }, [hospitals, near.center, radius]);
  const markers = useMemo<MapMarker[]>(
    () => [
      {
        id: PLACE_MARKER_ID,
        position: near.center,
        kind: 'place',
        label: near.place,
      },
      ...hospitals.flatMap((hospital, index) =>
        hospital.latitude === null || hospital.longitude === null
          ? []
          : [
              {
                id: hospital.ykiho,
                position: { lat: hospital.latitude, lng: hospital.longitude },
                kind: 'plain' as const,
                label: hospital.name,
                badge: String(index + 1),
              },
            ],
      ),
    ],
    [hospitals, near],
  );
  const mapHref = `/map?${buildMapQuery({
    item: code,
    region: DEFAULT_REGION,
    center: near.center,
    radius,
  })}` as const;

  const selectFromMap = (id: string) => {
    if (id === PLACE_MARKER_ID) return;
    setSelectedId(id);
    document
      .getElementById(rowId(id))
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h4 className="flex items-center gap-1.5 text-subheading text-text-primary">
          <MapPin
            aria-hidden="true"
            className="size-5 shrink-0 text-primary-text"
            strokeWidth={1.75}
          />
          {t('title', { place: near.place })}
        </h4>
        {firstPage && hospitals.length > 0 && (
          <p className="text-caption text-text-tertiary tabular-nums">
            {t('count', {
              km: radius / 1000,
              total: firstPage.totalElements,
              shown: hospitals.length,
            })}
          </p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-4">
        <div className="h-64 overflow-hidden rounded-xl border border-hairline md:h-auto md:min-h-80">
          <LazyHospitalMap
            search={view}
            markers={markers}
            selectedId={selectedId}
            onSelect={selectFromMap}
            onMoveEnd={() => {}}
          />
        </div>

        {query.isPending ? (
          <ul aria-busy="true" className="flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <li key={index}>
                <Skeleton className="h-24 w-full rounded-xl" />
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
          <ol className="flex flex-col divide-y divide-hairline overflow-hidden rounded-xl border border-hairline bg-bg md:max-h-96 md:overflow-y-auto">
            {hospitals.map((hospital, index) => (
              <li key={hospital.ykiho} id={rowId(hospital.ykiho)}>
                <NearbyRow
                  code={code}
                  itemName={itemName}
                  rank={index + 1}
                  hospital={hospital}
                  isSelected={hospital.ykiho === selectedId}
                  onSelect={() => setSelectedId(hospital.ykiho)}
                />
              </li>
            ))}
          </ol>
        )}
      </div>

      <Link
        href={mapHref}
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
  itemName,
  rank,
  hospital,
  isSelected,
  onSelect,
}: {
  code: string;
  itemName: string;
  rank: number;
  hospital: NearbyHospital;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations('ai.result.near');
  const distance = useDistanceLabel(hospital.distanceMeters);
  const tel = toTelHref(hospital.phone);
  const href =
    `/hospitals/${encodeURIComponent(hospital.ykiho)}?${new URLSearchParams({ item: code }).toString()}` as const;
  const position =
    hospital.latitude !== null && hospital.longitude !== null
      ? { lat: hospital.latitude, lng: hospital.longitude }
      : null;

  return (
    <article
      className={cn(
        'relative flex flex-col gap-2 px-4 py-3.5 transition-colors duration-200 ease-standard',
        isSelected ? 'bg-primary-tint' : 'hover:bg-surface',
      )}
      onMouseEnter={onSelect}
      onFocus={onSelect}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-caption-bold tabular-nums',
            isSelected
              ? 'bg-primary text-on-primary'
              : 'bg-surface-strong text-text-secondary',
          )}
        >
          {rank}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h5 className="text-label-bold wrap-break-word">
            <Link
              href={href}
              className="rounded-sm after:absolute after:inset-0 hover:text-primary-text"
            >
              {hospital.name}
            </Link>
          </h5>
          <p className="text-caption text-text-secondary">
            {[hospital.className, t('distance', { distance })]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {hospital.address && (
            <p className="text-caption wrap-break-word text-text-tertiary">
              {hospital.address}
            </p>
          )}
          {hospital.minPrice != null && (
            <p className="text-caption text-text-secondary tabular-nums">
              {t('price', { item: itemName, amount: hospital.minPrice })}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pl-9">
        <DirectionsButton
          name={hospital.name}
          query={hospital.address?.trim() || hospital.name}
          position={position}
        />
        {tel && (
          <Button asChild variant="outline" size="sm" className="relative z-10">
            <a href={tel}>
              <Phone aria-hidden="true" />
              {t('call')}
            </a>
          </Button>
        )}
      </div>
    </article>
  );
}
