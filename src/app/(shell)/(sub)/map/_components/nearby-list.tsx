'use client';

import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from '@tanstack/react-query';
import { CircleAlert, MapPinned } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { NearbyHospitalCard } from '@/features/map/components/nearby-hospital-card';
import { RADIUS_OPTIONS, type RadiusOption } from '@/features/map/map-geo';
import type { NearbyHospital } from '@/features/map/queries';
import { errorMessageKey } from '@/lib/api/error-message';
import { cn } from '@/lib/utils';

type NearbyPage = { content: NearbyHospital[]; totalElements: number };

export const hospitalCardId = (ykiho: string) => `map-hospital-${ykiho}`;

function hospitalHref(ykiho: string, item: string | null) {
  const path = `/hospitals/${encodeURIComponent(ykiho)}` as const;
  return item ? (`${path}?item=${encodeURIComponent(item)}` as const) : path;
}

/** 지도에 있는 병원을 가까운 순으로 모두 보여 준다. 위치가 없는 병원도 여기에는 나온다. */
export function NearbyList({
  query,
  hospitals,
  item,
  radius,
  isSearching,
  selectedId,
  onShowOnMap,
  onRadiusChange,
  onExpand,
  isSheet = false,
  className,
}: {
  query: UseInfiniteQueryResult<InfiniteData<NearbyPage>>;
  hospitals: NearbyHospital[];
  item: string | null;
  radius: RadiusOption;
  /** 첫 위치를 기다리는 중이라 아직 조회하지 않았다. */
  isSearching: boolean;
  selectedId: string | null;
  onShowOnMap: (id: string) => void;
  onRadiusChange: (radius: RadiusOption) => void;
  /** 모바일 지도 보기의 시트에서 목록 보기로 넘어간다. */
  onExpand?: () => void;
  /** 모바일 지도 보기에서 지도 아래 시트로 보인다(안에서 스크롤). md부터는 옆 목록 열이다. */
  isSheet?: boolean;
  className?: string;
}) {
  const tView = useTranslations('map.view');
  const t = useTranslations('map.list');
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('common.actions');
  const total = query.data?.pages[0]?.totalElements;
  const noPositionCount = hospitals.filter(
    (h) => h.latitude === null || h.longitude === null,
  ).length;
  const isLoading = isSearching || query.isPending;
  const wider = RADIUS_OPTIONS.find((option) => option > radius);

  return (
    <section
      aria-labelledby="map-list-title"
      data-sheet={isSheet || undefined}
      className={cn(
        'bg-bg md:w-88 md:shrink-0 md:overflow-y-auto md:border-r md:border-border lg:w-100 xl:w-115',
        'max-md:data-sheet:max-h-[45%] max-md:data-sheet:shrink-0 max-md:data-sheet:overflow-y-auto max-md:data-sheet:overscroll-contain max-md:data-sheet:rounded-t-3xl max-md:data-sheet:pb-safe max-md:data-sheet:shadow-sheet',
        className,
      )}
    >
      <div className="flex flex-col pb-section md:pb-8">
        <div
          data-list-header
          className={cn(
            'flex flex-col gap-1 bg-bg pt-5 px-page pb-3 md:px-5 lg:px-6',
            isSheet && 'max-md:sticky max-md:top-0 max-md:z-20 max-md:pt-2',
          )}
        >
          {isSheet && (
            <span
              aria-hidden="true"
              className="mx-auto mb-2 h-1 w-10 rounded-full bg-border-strong md:hidden"
            />
          )}
          <div className="flex items-center justify-between gap-3">
            <h2
              id="map-list-title"
              tabIndex={-1}
              className="text-subheading outline-none"
            >
              {isLoading || total === undefined
                ? t('titleLoading')
                : t('title', { count: total })}
            </h2>
            {isSheet && onExpand && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExpand}
                className="-mr-2 md:hidden"
              >
                {tView('expandList')}
              </Button>
            )}
          </div>
          <p className="text-body-sm text-text-tertiary">
            {t('sortNote', { km: radius / 1000 })}
          </p>
          {item && (
            <p
              className={cn(
                'text-body-sm text-text-tertiary',
                isSheet && 'max-md:hidden',
              )}
            >
              {t('priceNote')}
            </p>
          )}
          {noPositionCount > 0 && (
            <p
              className={cn(
                'text-body-sm text-text-secondary',
                isSheet && 'max-md:hidden',
              )}
            >
              {t('noPosition', { count: noPositionCount })}
            </p>
          )}
        </div>

        {isLoading ? (
          <ul
            aria-hidden="true"
            className="flex flex-col divide-y divide-hairline border-t border-hairline"
          >
            {[0, 1, 2].map((index) => (
              <li
                key={index}
                className="flex flex-col gap-2 py-4 px-page md:px-5 lg:px-6"
              >
                <div className="flex justify-between gap-4">
                  <Skeleton className="h-6 w-40" />
                  {item && <Skeleton className="h-8 w-28" />}
                </div>
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-9 w-32" />
              </li>
            ))}
          </ul>
        ) : query.isError ? (
          <EmptyState
            icon={<CircleAlert />}
            title={tErrors(errorMessageKey(query.error))}
            className="px-page"
            action={
              <Button
                variant="tint"
                size="md"
                onClick={() => void query.refetch()}
              >
                {tActions('retry')}
              </Button>
            }
          />
        ) : hospitals.length === 0 ? (
          <EmptyState
            icon={<MapPinned />}
            title={item ? t('emptyItemTitle') : t('emptyTitle')}
            description={t('emptyDescription')}
            className="px-page"
            action={
              wider && (
                <Button
                  variant="tint"
                  size="md"
                  onClick={() => onRadiusChange(wider)}
                >
                  {t('widen', { km: wider / 1000 })}
                </Button>
              )
            }
          />
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
              {hospitals.map((hospital) => (
                <li
                  key={hospital.ykiho}
                  id={hospitalCardId(hospital.ykiho)}
                  className="scroll-my-3"
                >
                  <NearbyHospitalCard
                    hospital={hospital}
                    href={hospitalHref(hospital.ykiho, item)}
                    hasItem={item !== null}
                    isSelected={hospital.ykiho === selectedId}
                    onShowOnMap={() => onShowOnMap(hospital.ykiho)}
                    className="px-page md:px-5 lg:px-6"
                  />
                </li>
              ))}
            </ul>
            <div className="flex flex-col items-center gap-3 pt-5 px-page md:px-5">
              {total !== undefined && total > hospitals.length && (
                <p className="text-caption text-text-tertiary tabular-nums">
                  {t('progress', { total, shown: hospitals.length })}
                </p>
              )}
              {query.isFetchNextPageError && (
                <p role="alert" className="text-body-sm text-danger">
                  {t('loadMoreError')}
                </p>
              )}
              {query.hasNextPage && (
                <Button
                  variant="outline"
                  size="md"
                  isLoading={query.isFetchingNextPage}
                  onClick={() => void query.fetchNextPage()}
                >
                  {tActions('more')}
                </Button>
              )}
            </div>
          </>
        )}
        <p role="status" className="sr-only">
          {!isLoading && total !== undefined
            ? t('results', { count: total })
            : ''}
        </p>
      </div>
    </section>
  );
}
