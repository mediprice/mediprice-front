'use client';

import { MapPin, MapPinOff } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { NearbyHospital } from '../queries';

/** 주변 병원 한 곳. 지도에서 고른 병원은 테두리와 "지도에서 선택됨" 문구로 함께 표시한다(색만으로 구분하지 않음). */
export function NearbyHospitalCard<T extends string>({
  hospital,
  href,
  hasItem,
  isSelected,
  onShowOnMap,
  className,
  ...props
}: Omit<ComponentProps<'article'>, 'children'> & {
  hospital: NearbyHospital;
  href: Route<T>;
  /** 항목을 골라 가격을 보여 주는 중인지. 아니면 가격 줄을 빼고 병원 정보만 보여 준다. */
  hasItem: boolean;
  isSelected: boolean;
  onShowOnMap?: () => void;
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
        'flex flex-col gap-3 rounded-xl border-2 border-transparent bg-bg p-4 shadow-card transition-colors duration-150 ease-standard lg:px-5',
        'data-selected:border-primary data-selected:bg-primary-tint/40',
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-1">
        {isSelected && (
          <p className="flex items-center gap-1 text-caption-bold text-primary-text">
            <MapPin aria-hidden="true" className="size-3.5" strokeWidth={2} />
            {t('selected')}
          </p>
        )}
        <h3 className="text-subheading">{hospital.name}</h3>
        <p className="text-body-sm text-text-secondary">{meta}</p>
        {hospital.address && (
          <p className="line-clamp-2 text-body-sm text-text-tertiary">
            {hospital.address}
          </p>
        )}
      </div>

      {hasItem &&
        (hospital.minPrice === null ? (
          <p className="text-subheading text-text-tertiary">{tPrice('none')}</p>
        ) : (
          <p className="text-price-lg tabular-nums">
            {t('minPrice', { amount: hospital.minPrice })}
          </p>
        ))}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {hasPosition ? (
          <Button
            variant="tint"
            size="sm"
            aria-label={t('showOnMapLabel', { name: hospital.name })}
            aria-pressed={isSelected}
            onClick={onShowOnMap}
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
        <Button asChild variant="primary" size="sm" className="ml-auto">
          <Link
            href={href}
            aria-label={t('detailLabel', { name: hospital.name })}
          >
            {t('detail')}
          </Link>
        </Button>
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
