import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { formatLocation } from '@/features/regions/format-location';
import type { components } from '@/lib/api/schema';

type HospitalSummary = components['schemas']['HospitalSummaryResponse'];

/** 병원 결과 카드. 진료과 정보는 목록 API에 없어 종별과 시군구를 함께 보여 준다. */
export function HospitalCard({ hospital }: { hospital: HospitalSummary }) {
  const t = useTranslations('search.hospital');
  const location = formatLocation(hospital.sidoName, hospital.sgguName);
  const meta = [hospital.className, location].filter(Boolean).join(' · ');

  return (
    <Link
      href={`/hospitals/${encodeURIComponent(hospital.ykiho)}`}
      className="group flex items-center gap-3 rounded-xl bg-bg py-4 pr-2 pl-4 shadow-card transition-shadow hover:shadow-float lg:gap-6 lg:p-6"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-subheading">{hospital.name}</span>
        {meta && (
          <span className="text-body-sm text-text-secondary lg:order-first lg:text-primary-text">
            {meta}
          </span>
        )}
        {hospital.address && (
          <span className="text-body-sm text-text-tertiary">
            {hospital.address}
          </span>
        )}
      </span>
      <ChevronRight
        aria-hidden="true"
        className="m-3 size-5 shrink-0 text-text-secondary lg:hidden"
        strokeWidth={1.75}
      />
      <span
        aria-hidden="true"
        className="hidden shrink-0 items-center gap-0.5 rounded-lg bg-primary-tint px-5 py-2.5 text-label-bold text-primary-text transition-colors group-hover:bg-primary-tint-hover lg:inline-flex"
      >
        {t('viewDetail')}
        <ChevronRight className="size-4" strokeWidth={2} />
      </span>
    </Link>
  );
}
