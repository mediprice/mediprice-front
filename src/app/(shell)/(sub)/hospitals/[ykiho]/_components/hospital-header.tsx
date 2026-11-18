import { MapPin } from 'lucide-react';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';

import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
} from '@/components/layout/breadcrumb';
import { Tag } from '@/components/ui/tag';
import { formatLocation } from '@/features/regions/format-location';
import type { components } from '@/lib/api/schema';
import { cn } from '@/lib/utils';

type Hospital = components['schemas']['HospitalDetailResponse'];

/** 흰 바탕 머리: 경로(데스크톱), 종별·지역, 큰 병원 이름, 주소. 연락처와 관심·비교는 HospitalContact가 맡는다. */
export function HospitalHeader<T extends string>({
  hospital,
  itemCrumb,
  className,
}: {
  hospital: Hospital;
  /** 항목에서 들어왔을 때 경로 가운데 칸(항목 이름 → 항목 가격 화면). */
  itemCrumb: { href: Route<T>; name: string } | null;
  className?: string;
}) {
  const tNav = useTranslations('nav');
  const region = [
    formatLocation(hospital.sidoName, hospital.sgguName),
    hospital.emdongName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={cn('flex flex-col gap-3', className)}>
      <div className="hidden lg:mb-2 lg:block">
        <Breadcrumb>
          <BreadcrumbLink href="/">{tNav('home')}</BreadcrumbLink>
          {itemCrumb && (
            <BreadcrumbLink href={itemCrumb.href}>
              {itemCrumb.name}
            </BreadcrumbLink>
          )}
          <BreadcrumbCurrent>{hospital.name}</BreadcrumbCurrent>
        </Breadcrumb>
      </div>
      {(hospital.className || region) && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-label text-text-secondary">
          {hospital.className && <Tag>{hospital.className}</Tag>}
          {region && <span>{region}</span>}
        </p>
      )}
      <h1 className="min-w-0 text-display text-balance break-keep">
        {hospital.name}
      </h1>
      {hospital.address && (
        <p className="flex items-start gap-1.5 text-body text-text-secondary">
          <MapPin
            aria-hidden="true"
            className="mt-1 size-4 shrink-0 text-text-tertiary"
            strokeWidth={1.75}
          />
          {hospital.address}
        </p>
      )}
    </header>
  );
}
