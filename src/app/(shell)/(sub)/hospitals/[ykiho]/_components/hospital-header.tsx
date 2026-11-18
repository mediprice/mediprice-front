'use client';

import { ExternalLink, Globe, MapPin, Phone, Stethoscope } from 'lucide-react';
import type { Route } from 'next';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
} from '@/components/layout/breadcrumb';
import { PageContainer } from '@/components/layout/page-container';
import { Tag } from '@/components/ui/tag';
import { CompareToggle } from '@/features/comparison/components/compare-toggle';
import { FavoriteButton } from '@/features/favorites/components/favorite-button';
import { toHomepageUrl, toTelHref } from '@/features/hospitals/detail-links';
import { formatLocation } from '@/features/regions/format-location';
import type { components } from '@/lib/api/schema';

type Hospital = components['schemas']['HospitalDetailResponse'];

const META_LINK =
  'inline-flex min-h-11 items-center gap-1.5 rounded-md text-label text-text-primary underline-offset-4 hover:underline [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-text-tertiary';

/** 관심·비교 버튼은 모바일에서 연락처 아래, 데스크톱에서 병원 이름 오른쪽(grid 둘째 칸)에 둔다. */
export function HospitalHeader<T extends string>({
  hospital,
  itemCrumb,
}: {
  hospital: Hospital;
  /** 항목에서 들어왔을 때 경로 가운데 칸(항목 이름 → 항목 가격 화면). */
  itemCrumb: { href: Route<T>; name: string } | null;
}) {
  const t = useTranslations('hospitals.detail.header');
  const tNav = useTranslations('nav');
  /** HospitalDetail이 선택 항목을 history로 바꿔도 useSearchParams가 따라온다. */
  const itemCode = useSearchParams().get('item');
  const region = [
    formatLocation(hospital.sidoName, hospital.sgguName),
    hospital.emdongName,
  ]
    .filter(Boolean)
    .join(' ');
  const tel = toTelHref(hospital.phone);
  const homepage = toHomepageUrl(hospital.homepage);

  return (
    <div className="bg-primary-tint">
      <PageContainer className="flex flex-col gap-2.5 pt-6 pb-5 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-8 lg:pt-4 lg:pb-7">
        <div className="hidden lg:col-span-2 lg:block">
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
          <p className="flex flex-wrap items-center gap-2 text-caption-strong text-text-secondary lg:col-start-1">
            {hospital.className && (
              <Tag tone="onBand">{hospital.className}</Tag>
            )}
            {region && <span>{region}</span>}
          </p>
        )}
        <h1 className="min-w-0 text-hero text-balance lg:col-start-1">
          {hospital.name}
        </h1>
        {hospital.address && (
          <p className="flex items-start gap-1.5 text-body-sm text-text-secondary lg:col-start-1">
            <MapPin
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-text-tertiary"
              strokeWidth={1.75}
            />
            {hospital.address}
          </p>
        )}
        {(tel || homepage || hospital.doctorCount != null) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 lg:col-start-1">
            {tel && hospital.phone && (
              <a href={tel} className={META_LINK}>
                <Phone aria-hidden="true" strokeWidth={1.75} />
                <span className="tabular-nums">
                  {t('call', { phone: hospital.phone })}
                </span>
              </a>
            )}
            {homepage && (
              <a
                href={homepage.href}
                target="_blank"
                rel="noopener noreferrer"
                className={META_LINK}
              >
                <Globe aria-hidden="true" strokeWidth={1.75} />
                {t('homepage')}
                <span className="text-caption text-text-tertiary">
                  {t('newWindow')}
                </span>
                <ExternalLink aria-hidden="true" strokeWidth={1.75} />
              </a>
            )}
            {hospital.doctorCount != null && hospital.doctorCount > 0 && (
              <span className="inline-flex min-h-11 items-center gap-1.5 text-label text-text-secondary">
                <Stethoscope
                  aria-hidden="true"
                  className="size-4 text-text-tertiary"
                  strokeWidth={1.75}
                />
                {t('doctors', { count: hospital.doctorCount })}
              </span>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 lg:col-start-2 lg:row-start-3 lg:self-center">
          <FavoriteButton
            ykiho={hospital.ykiho}
            hospital={{
              name: hospital.name,
              className: hospital.className,
              address: hospital.address,
              phone: hospital.phone,
            }}
            variant="labeled"
          />
          <CompareToggle
            ykiho={hospital.ykiho}
            name={hospital.name}
            itemCode={itemCode}
          />
        </div>
      </PageContainer>
    </div>
  );
}
