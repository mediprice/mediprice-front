import { ExternalLink, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { buildNaverMapUrl } from '@/features/hospitals/detail-links';
import type { components } from '@/lib/api/schema';

type Hospital = components['schemas']['HospitalDetailResponse'];

/** 지도 SDK 없이 주소를 보여 주고 네이버 지도 검색을 새 창으로 연다. */
export function LocationSection({ hospital }: { hospital: Hospital }) {
  const t = useTranslations('hospitals.detail.location');
  const query = hospital.address?.trim() || hospital.name;

  return (
    <section
      id="location"
      aria-labelledby="location-title"
      className="flex scroll-mt-14 flex-col gap-4"
    >
      <h2 id="location-title" className="text-heading">
        {t('title')}
      </h2>
      <div className="flex items-start gap-4 rounded-xl bg-hero px-5 py-5 lg:px-6">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-float"
        >
          <MapPin className="size-5" strokeWidth={1.75} />
        </span>
        <div className="flex min-w-0 flex-col gap-1 pt-0.5">
          <p className="text-body text-text-primary">
            {hospital.address ?? t('noAddress')}
          </p>
          {hospital.postNo && (
            <p className="text-caption text-text-secondary tabular-nums">
              {t('postNo', { postNo: hospital.postNo })}
            </p>
          )}
        </div>
      </div>
      <Button asChild variant="tint" size="lg" className="w-full">
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
    </section>
  );
}
