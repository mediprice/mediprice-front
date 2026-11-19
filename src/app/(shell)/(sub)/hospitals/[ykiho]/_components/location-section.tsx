import { ExternalLink, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { DirectionsButton } from '@/features/hospitals/components/directions-button';
import { HospitalLocationMap } from '@/features/hospitals/components/hospital-location-map';
import { buildNaverMapUrl } from '@/features/hospitals/detail-links';
import { formatLocation } from '@/features/regions/format-location';
import type { components } from '@/lib/api/schema';

type Hospital = components['schemas']['HospitalDetailResponse'];

/** 좌표가 있으면 네이버 지도에 병원 위치를 보여 주고, 주소와 함께 길찾기(앱 딥링크)·네이버 지도 열기를 둔다. */
export function LocationSection({ hospital }: { hospital: Hospital }) {
  const t = useTranslations('hospitals.detail.location');
  const query = hospital.address?.trim() || hospital.name;
  const region = formatLocation(hospital.sidoName, hospital.sgguName);
  const position =
    hospital.latitude != null && hospital.longitude != null
      ? { lat: hospital.latitude, lng: hospital.longitude }
      : null;

  return (
    <section
      id="location"
      aria-labelledby="location-title"
      className="flex scroll-mt-14 flex-col gap-4"
    >
      <SectionHeader id="location-title" title={t('title')} />
      {position && (
        <HospitalLocationMap
          id={hospital.ykiho}
          name={hospital.name}
          position={position}
        />
      )}
      <div className="flex flex-col gap-5 rounded-2xl bg-surface p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex min-w-0 items-start gap-3.5">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary-text max-[22rem]:hidden"
          >
            <MapPin className="size-5" strokeWidth={1.75} />
          </span>
          <div className="flex min-w-0 flex-col gap-1 pt-0.5">
            <p className="text-body-lg text-text-primary">
              {hospital.address ?? t('noAddress')}
            </p>
            {(region || hospital.postNo) && (
              <p className="text-body-sm text-text-secondary tabular-nums">
                {[
                  region,
                  hospital.postNo && t('postNo', { postNo: hospital.postNo }),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:shrink-0">
          <DirectionsButton
            name={hospital.name}
            query={query}
            position={position}
            className="min-h-11 flex-1 px-4 md:flex-none"
          />
          <Button
            asChild
            variant="outline"
            size="md"
            className="flex-1 md:flex-none"
          >
            <a
              href={buildNaverMapUrl(query)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('openMap')}
              <span className="sr-only">{t('newWindow')}</span>
              <ExternalLink aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
