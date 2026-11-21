import { ExternalLink, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { DirectionsButton } from '@/features/hospitals/components/directions-button';
import { buildNaverMapUrl } from '@/features/hospitals/detail-links';
import { formatLocation } from '@/features/regions/format-location';
import type { components } from '@/lib/api/schema';

type Hospital = components['schemas']['HospitalDetailResponse'];

/** 주소와 길찾기(네이버 지도 앱 딥링크)·네이버 지도 열기. 위치 지도는 화면의 지도 영역이 보여 준다. */
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
      <div className="flex items-start gap-4 rounded-xl bg-surface px-5 py-5 max-[22rem]:px-4 lg:px-6">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-float max-[22rem]:hidden"
        >
          <MapPin className="size-5" strokeWidth={1.75} />
        </span>
        <div className="flex min-w-0 flex-col gap-1 pt-0.5">
          <p className="text-body wrap-break-word text-text-primary">
            {hospital.address ?? t('noAddress')}
          </p>
          {(region || hospital.postNo) && (
            <p className="text-caption text-text-secondary tabular-nums">
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
      <div className="flex flex-wrap gap-2 *:flex-[1_1_10rem]">
        <DirectionsButton
          name={hospital.name}
          query={query}
          position={position}
          className="min-h-13 px-5 py-3"
        />
        <Button asChild variant="tint" size="lg">
          <a
            href={buildNaverMapUrl(query)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('openMap')}
            <span className="text-caption-strong">{t('newWindow')}</span>
            <ExternalLink aria-hidden="true" />
          </a>
        </Button>
      </div>
    </section>
  );
}
