import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import type { components } from '@/lib/api/schema';

type HospitalSummary = components['schemas']['HospitalSummaryResponse'];

/** 병원 결과 카드. 진료과 정보는 목록 API에 없어 종별(className)만 보여 준다. */
export function HospitalCard({ hospital }: { hospital: HospitalSummary }) {
  const t = useTranslations('search.hospital');
  const address =
    hospital.address ??
    [hospital.sidoName, hospital.sgguName].filter(Boolean).join(' ');

  return (
    <Link
      href={`/hospitals/${encodeURIComponent(hospital.ykiho)}`}
      className="group flex items-center gap-3 rounded-xl bg-bg py-4 pr-2 pl-4 shadow-card transition-shadow hover:shadow-float lg:gap-6 lg:p-6"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-subheading">{hospital.name}</span>
        {hospital.className && (
          <span className="text-body-sm text-text-secondary lg:order-first lg:text-primary-text">
            {hospital.className}
          </span>
        )}
        {address && (
          <span className="text-body-sm text-text-secondary">{address}</span>
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
