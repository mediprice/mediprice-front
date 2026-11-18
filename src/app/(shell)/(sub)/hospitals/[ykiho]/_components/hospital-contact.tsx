'use client';

import {
  ChevronRight,
  ExternalLink,
  Globe,
  Phone,
  Stethoscope,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { CompareToggle } from '@/features/comparison/components/compare-toggle';
import { FavoriteButton } from '@/features/favorites/components/favorite-button';
import { toHomepageUrl, toTelHref } from '@/features/hospitals/detail-links';
import type { components } from '@/lib/api/schema';
import { cn } from '@/lib/utils';

type Hospital = components['schemas']['HospitalDetailResponse'];

const ROW =
  'flex min-h-16 items-center gap-3.5 py-3 text-left text-text-primary';
const LINK_ROW = cn(
  ROW,
  '-mx-2 rounded-xl px-2 transition-colors duration-200 ease-standard hover:bg-surface-strong active:bg-border',
);

/** 관심·비교 버튼과 전화·홈페이지·의료진 행. 모바일은 머리 바로 아래, 데스크톱은 오른쪽 열에 붙어 따라온다. */
export function HospitalContact({
  hospital,
  className,
}: {
  hospital: Hospital;
  className?: string;
}) {
  const t = useTranslations('hospitals.detail.header');
  /** HospitalDetail이 선택 항목을 history로 바꿔도 useSearchParams가 따라온다. */
  const itemCode = useSearchParams().get('item');
  const tel = toTelHref(hospital.phone);
  const homepage = toHomepageUrl(hospital.homepage);
  const doctorCount =
    hospital.doctorCount != null && hospital.doctorCount > 0
      ? hospital.doctorCount
      : null;
  const hasRows = Boolean(tel || homepage || doctorCount);

  return (
    <aside
      aria-label={t('contactLabel')}
      className={cn('flex flex-col gap-3', className)}
    >
      <div className="grid grid-cols-2 gap-2">
        <FavoriteButton
          ykiho={hospital.ykiho}
          hospital={{
            name: hospital.name,
            className: hospital.className,
            address: hospital.address,
            phone: hospital.phone,
          }}
          variant="labeled"
          className="min-h-12 w-full rounded-xl"
        />
        <CompareToggle
          ykiho={hospital.ykiho}
          name={hospital.name}
          itemCode={itemCode}
          className="min-h-12 w-full rounded-xl"
        />
      </div>
      {hasRows && (
        <ul className="flex flex-col divide-y divide-border rounded-2xl bg-surface px-4">
          {tel && hospital.phone && (
            <li>
              <a href={tel} className={LINK_ROW}>
                <RowIcon>
                  <Phone />
                </RowIcon>
                <RowText label={t('phone')}>
                  <PhoneNumber phone={hospital.phone} />
                </RowText>
                <ChevronRight
                  aria-hidden="true"
                  className="size-5 shrink-0 text-text-tertiary max-[22rem]:hidden"
                  strokeWidth={1.75}
                />
              </a>
            </li>
          )}
          {homepage && (
            <li>
              <a
                href={homepage.href}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_ROW}
              >
                <RowIcon>
                  <Globe />
                </RowIcon>
                <RowText label={t('homepage')}>
                  <span className="wrap-anywhere">{homepage.label}</span>
                </RowText>
                <span className="sr-only">{t('newWindow')}</span>
                <ExternalLink
                  aria-hidden="true"
                  className="size-5 shrink-0 text-text-tertiary"
                  strokeWidth={1.75}
                />
              </a>
            </li>
          )}
          {doctorCount != null && (
            <li className={ROW}>
              <RowIcon>
                <Stethoscope />
              </RowIcon>
              <RowText label={t('doctorsTitle')}>
                {t('doctors', { count: doctorCount })}
              </RowText>
            </li>
          )}
        </ul>
      )}
    </aside>
  );
}

/** 좁은 화면(큰 글자)에서는 지역번호 뒤에서만 줄을 바꾸고 번호 묶음은 끊지 않는다. */
function PhoneNumber({ phone }: { phone: string }) {
  const cut = phone.indexOf('-') + 1;
  return (
    <span className="tabular-nums">
      <span className="whitespace-nowrap">{phone.slice(0, cut)}</span>
      <wbr />
      <span className="whitespace-nowrap">{phone.slice(cut)}</span>
    </span>
  );
}

function RowIcon({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg text-text-secondary max-[22rem]:hidden [&_svg]:size-5 [&_svg]:[stroke-width:1.75]"
    >
      {children}
    </span>
  );
}

function RowText({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="text-caption text-text-secondary">{label}</span>
      <span className="text-subheading text-text-primary">{children}</span>
    </span>
  );
}
