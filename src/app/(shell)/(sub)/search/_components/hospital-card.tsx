import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { FavoriteButton } from '@/features/favorites/components/favorite-button';
import { HospitalIdentity } from '@/features/hospitals/components/hospital-identity';
import { formatLocation } from '@/features/regions/format-location';
import type { components } from '@/lib/api/schema';

type HospitalSummary = components['schemas']['HospitalSummaryResponse'];

/**
 * 병원 결과 한 행. 행 전체는 이름 링크가 덮고(after 영역), 관심 버튼만 그 위에 올린다. 목록이 구분선을 준다.
 * 진료과 정보는 목록 API에 없어 종별과 시군구를 이름 아래에 보여 준다.
 */
export function HospitalCard({ hospital }: { hospital: HospitalSummary }) {
  const location = formatLocation(hospital.sidoName, hospital.sgguName);
  const meta = [hospital.className, location].filter(Boolean).join(' · ');

  return (
    <article className="group relative -mx-4 flex items-center gap-2 py-4 pr-2 pl-4 transition-colors duration-200 ease-standard hover:bg-surface active:bg-surface lg:py-5">
      <HospitalIdentity
        as="h2"
        className="flex-1"
        nameClassName="text-heading"
        name={
          <Link
            href={`/hospitals/${encodeURIComponent(hospital.ykiho)}`}
            className="rounded-sm group-hover:text-primary-text after:absolute after:inset-0"
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
      <FavoriteButton
        ykiho={hospital.ykiho}
        hospital={{
          name: hospital.name,
          className: hospital.className,
          address: hospital.address,
          phone: hospital.phone,
        }}
        variant="icon"
        className="relative"
      />
      <ChevronRight
        aria-hidden="true"
        className="hidden size-6 shrink-0 text-text-tertiary group-hover:text-primary-text lg:block"
        strokeWidth={1.75}
      />
    </article>
  );
}
