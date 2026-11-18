'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { NearbyHospitalCard } from '@/features/map/components/nearby-hospital-card';
import type { NearbyHospital } from '@/features/map/queries';

import { hospitalHref } from './nearby-list';

/** 모바일 지도 보기에서 고른 병원. 지도를 가리지 않게 지도 아래에 둔다. */
export function SelectedHospitalPanel({
  hospital,
  item,
  onClear,
}: {
  hospital: NearbyHospital;
  item: string | null;
  onClear: () => void;
}) {
  const t = useTranslations('map.card');
  return (
    <section
      aria-labelledby="map-selected-title"
      className="flex shrink-0 flex-col gap-2 border-t border-hairline bg-bg pt-2 px-page pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] lg:hidden"
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id="map-selected-title"
          className="text-label-bold text-text-secondary"
        >
          {t('selectedHeading')}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X aria-hidden="true" />
          {t('clearSelection')}
        </Button>
      </div>
      <NearbyHospitalCard
        hospital={hospital}
        href={hospitalHref(hospital.ykiho, item)}
        hasItem={item !== null}
        isSelected
        isCompact
      />
    </section>
  );
}
