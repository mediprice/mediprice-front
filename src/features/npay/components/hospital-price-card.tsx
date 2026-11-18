import { ChevronRight, Hospital } from 'lucide-react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';

import type { components } from '@/lib/api/schema';

type HospitalPrice = components['schemas']['HospitalPriceResponse'];

/** 항목별 가격 목록의 병원 한 곳. 같은 병원이 표기 이름별로 여러 번 나올 수 있어 병원 표기 이름을 함께 보여 준다. */
export function HospitalPriceCard({
  price,
  itemCode,
}: {
  price: HospitalPrice;
  itemCode: string;
}) {
  const t = useTranslations('items.card');
  const tPrice = useTranslations('common.price');
  const format = useFormatter();

  const region =
    price.sidoName && price.sgguName
      ? t('region', { sido: price.sidoName, sggu: price.sgguName })
      : (price.sidoName ?? price.sgguName);
  const meta =
    price.className && region
      ? t('meta', { kind: price.className, region })
      : (price.className ?? region);
  const href =
    `/hospitals/${encodeURIComponent(price.ykiho)}?item=${encodeURIComponent(itemCode)}` as const;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col gap-2.5 rounded-xl bg-bg px-4 pt-4 pb-3.5 shadow-card transition-shadow duration-150 ease-standard hover:shadow-float active:bg-surface lg:px-6 lg:py-5"
    >
      <span className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary"
        >
          <Hospital className="size-5.5" strokeWidth={1.75} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-subheading group-hover:text-primary-text">
            {price.hospitalName}
          </span>
          {meta && (
            <span className="text-body-sm text-text-tertiary">{meta}</span>
          )}
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-5 shrink-0 text-text-tertiary"
          strokeWidth={1.75}
        />
      </span>
      <span className="text-price-lg tabular-nums">
        {tPrice('won', { amount: price.price })}
      </span>
      <span className="flex flex-col gap-1 lg:flex-row lg:flex-wrap lg:items-baseline lg:gap-x-3">
        {price.itemName && (
          <span className="text-body-sm text-text-secondary">
            {price.itemName}
          </span>
        )}
        <span className="text-caption text-text-tertiary">
          {price.startDate
            ? t('startDate', {
                date: format.dateTime(new Date(price.startDate), 'date'),
              })
            : t('startDateUnknown')}
        </span>
      </span>
    </Link>
  );
}
