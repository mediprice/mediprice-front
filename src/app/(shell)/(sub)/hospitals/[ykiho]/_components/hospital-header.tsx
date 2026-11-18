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
    <div className="bg-hero">
      <PageContainer className="flex flex-col gap-2.5 pt-6 pb-5 lg:pt-4 lg:pb-7">
        <Breadcrumb>
          <BreadcrumbLink href="/">{tNav('home')}</BreadcrumbLink>
          {itemCrumb && (
            <BreadcrumbLink href={itemCrumb.href}>
              {itemCrumb.name}
            </BreadcrumbLink>
          )}
          <BreadcrumbCurrent>{hospital.name}</BreadcrumbCurrent>
        </Breadcrumb>
        {(hospital.className || region) && (
          <p className="flex flex-wrap items-center gap-2 text-caption-strong text-primary-text">
            {hospital.className && (
              <Tag className="bg-bg text-primary-text">
                {hospital.className}
              </Tag>
            )}
            {region && <span>{region}</span>}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h1 className="min-w-0 text-hero">{hospital.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
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
        </div>
        {hospital.address && (
          <p className="flex items-start gap-1.5 text-body-sm text-text-secondary">
            <MapPin
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-text-tertiary"
              strokeWidth={1.75}
            />
            {hospital.address}
          </p>
        )}
        {(tel || homepage || hospital.doctorCount != null) && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-0">
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
      </PageContainer>
    </div>
  );
}
