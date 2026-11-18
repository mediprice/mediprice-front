'use client';

import { MapPin, MapPinOff } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/features/favorites/components/favorite-button';
import { HospitalIdentity } from '@/features/hospitals/components/hospital-identity';
import { AverageTag } from '@/features/npay/components/average-tag';
import { cn } from '@/lib/utils';

import type { NearbyHospital } from '../queries';

/**
 * 주변 병원 한 행. 행 전체가 병원 상세 링크이고(이름 링크를 행 크기로 넓힘) 하트·지도에서 보기만 그 위에 놓인다.
 * 가격(이 병원 세부 항목 중 가장 낮은 값)은 오른쪽에 크게 쓰고, 항목 행과 같은 규칙의 평균 대비 꼬리표를 붙인다. 지도에서 고른 병원은 옅은 면과 "지도에서 선택됨" 문구로 함께 표시한다(색만으로 구분하지 않음).
 * 목록이 행 사이 구분선을 준다.
 */
export function NearbyHospitalCard<T extends string>({
  hospital,
  href,
  hasItem,
  average,
  isSelected,
  onShowOnMap,
  className,
  ...props
}: Omit<ComponentProps<'article'>, 'children'> & {
  hospital: NearbyHospital;
  href: Route<T>;
  /** 항목을 골라 가격을 보여 주는 중인지. 아니면 가격을 빼고 병원 정보만 보여 준다. */
  hasItem: boolean;
  /** 꼬리표의 기준 평균(서울·경기). 없으면 꼬리표를 뺀다. */
  average?: number | null;
  isSelected: boolean;
  onShowOnMap: () => void;
}) {
  const t = useTranslations('map.card');
  const tPrice = useTranslations('common.price');
  const distance = useDistanceLabel(hospital.distanceMeters);
  const hasPosition = hospital.latitude !== null && hospital.longitude !== null;
  const meta = [hospital.className, t('distance', { distance })]
    .filter(Boolean)
    .join(' · ');

  return (
    <article
      data-selected={isSelected || undefined}
      className={cn(
        'relative flex flex-col gap-3 py-4 transition-colors duration-200 ease-standard hover:bg-surface active:bg-surface',
        'data-selected:bg-primary-tint data-selected:hover:bg-primary-tint-hover',
        className,
      )}
      {...props}
    >
      {isSelected && (
        <p className="-mb-1 flex items-center gap-1 text-caption-bold text-primary-text">
          <MapPin aria-hidden="true" className="size-3.5" strokeWidth={2} />
          {t('selected')}
        </p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <HospitalIdentity
          as="h3"
          name={
            <Link
              href={href}
              className="-my-3 inline-block max-w-full rounded-sm py-3 wrap-break-word after:absolute after:inset-0 hover:text-primary-text"
            >
              {hospital.name}
            </Link>
          }
          meta={meta}
          className="min-w-0 flex-1 basis-40"
        >
          {hospital.address && (
            <p className="line-clamp-2 text-body-sm text-text-tertiary">
              {hospital.address}
            </p>
          )}
        </HospitalIdentity>
        {hasItem && (
          <div className="ml-auto flex max-w-full flex-col items-end text-right">
            {hospital.minPrice === null ? (
              <p className="pt-0.5 text-body-sm text-text-tertiary">
                {tPrice('none')}
              </p>
            ) : (
              <>
                <p className="text-body-sm text-text-secondary">
                  {t('priceLabel')}
                </p>
                <p className="text-price-lg wrap-anywhere">
                  {tPrice('won', { amount: hospital.minPrice })}
                </p>
                <AverageTag
                  price={hospital.minPrice}
                  average={average}
                  className="mt-1"
                />
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex min-h-11 flex-wrap items-center justify-between gap-2">
        {hasPosition ? (
          <Button
            variant={isSelected ? 'primary' : 'tint'}
            size="sm"
            aria-label={t('showOnMapLabel', { name: hospital.name })}
            aria-pressed={isSelected}
            onClick={onShowOnMap}
            className="relative z-10"
          >
            <MapPin aria-hidden="true" />
            {t('showOnMap')}
          </Button>
        ) : (
          <span className="flex items-center gap-1 text-body-sm text-text-tertiary">
            <MapPinOff
              aria-hidden="true"
              className="size-4"
              strokeWidth={1.75}
            />
            {t('noPosition')}
          </span>
        )}
        <FavoriteButton
          ykiho={hospital.ykiho}
          hospital={hospital}
          variant="icon"
          className="relative z-10 -mr-2"
        />
      </div>
    </article>
  );
}

function useDistanceLabel(meters: number) {
  const t = useTranslations('map.card');
  return meters < 1000
    ? t('meters', { value: meters })
    : t('kilometers', { value: meters / 1000 });
}
