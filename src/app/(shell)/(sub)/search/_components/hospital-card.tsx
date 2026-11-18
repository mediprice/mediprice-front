import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { FavoriteButton } from '@/features/favorites/components/favorite-button';
import { HospitalIdentity } from '@/features/hospitals/components/hospital-identity';
import { formatLocation } from '@/features/regions/format-location';
import type { components } from '@/lib/api/schema';

type HospitalSummary = components['schemas']['HospitalSummaryResponse'];

/**
 * 병원 결과 카드. 카드 전체는 이름 링크가 덮고(after 영역), 관심 버튼만 그 위에 올린다.
 * 진료과 정보는 목록 API에 없어 종별과 시군구를 이름 아래에 보여 준다.
 */
export function HospitalCard({ hospital }: { hospital: HospitalSummary }) {
  const t = useTranslations('search.hospital');
  const location = formatLocation(hospital.sidoName, hospital.sgguName);
  const meta = [hospital.className, location].filter(Boolean).join(' · ');

  return (
    <article className="relative flex items-start gap-2 rounded-xl pressable bg-bg py-4 pr-2 pl-4 shadow-card lg:items-center lg:gap-6 lg:py-5 lg:pr-4 lg:pl-6">
      <HospitalIdentity
        as="h2"
        className="flex-1"
        name={
          <Link
            href={`/hospitals/${encodeURIComponent(hospital.ykiho)}`}
            className="rounded-sm after:absolute after:inset-0 after:rounded-xl"
          >
            {hospital.name}
          </Link>
        }
        meta={meta || undefined}
      >
        {hospital.address && (
          <p className="text-body-sm text-text-tertiary">{hospital.address}</p>
        )}
      </HospitalIdentity>
      <span
        aria-hidden="true"
        className="hidden shrink-0 items-center gap-0.5 rounded-lg bg-primary-tint px-5 py-2.5 text-label-bold whitespace-nowrap text-primary-text lg:inline-flex"
      >
        {t('viewDetail')}
        <ChevronRight className="size-4" strokeWidth={2} />
      </span>
      <FavoriteButton
        ykiho={hospital.ykiho}
        hospital={{
          name: hospital.name,
          className: hospital.className,
          address: hospital.address,
          phone: hospital.phone,
        }}
        variant="icon"
        className="relative -mt-2.5 lg:mt-0"
      />
    </article>
  );
}
