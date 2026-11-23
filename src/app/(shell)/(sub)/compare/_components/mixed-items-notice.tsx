'use client';

import { useQueries } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { buildCompareHref } from '@/features/comparison/compare-params';
import {
  basketItemCodes,
  useCompareStore,
} from '@/features/comparison/compare-store';
import { npayQueries } from '@/features/npay/queries';

/**
 * 비교함에 서로 다른 항목에서 담은 병원이 섞여 있으면, 지금 어느 항목 기준인지 알리고 다른 항목 기준으로 바꿀 링크를 준다.
 * 지금 보는 병원들이 비교함과 같을 때만 보인다(공유 링크로 연 비교에는 담은 항목 정보가 없다).
 */
export function MixedItemsNotice({
  ykihos,
  item,
}: {
  ykihos: readonly string[];
  item: string | null;
}) {
  const t = useTranslations('comparison.page');
  const basket = useCompareStore((state) => state.hospitals);
  const isSameBasket =
    basket.length === ykihos.length &&
    basket.every((hospital) => ykihos.includes(hospital.ykiho));
  const codes = isSameBasket ? basketItemCodes(basket) : [];
  const others = codes.filter((code) => code !== item);
  const names = useQueries({
    queries: codes.map((code) => npayQueries.detail(code)),
  });
  if (!item || codes.length < 2 || !codes.includes(item)) return null;
  const nameOf = (code: string) =>
    names[codes.indexOf(code)]?.data?.name ?? code;

  return (
    <div className="flex items-start gap-2 rounded-lg bg-primary-tint px-4 py-3 text-body-sm text-primary-text">
      <Info
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0"
        strokeWidth={1.75}
      />
      <div className="flex min-w-0 flex-col gap-1.5">
        <p>{t('mixedItems', { item: nameOf(item) })}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {others.map((code) => (
            <li key={code}>
              <Link
                href={buildCompareHref(ykihos, code)}
                replace
                className="inline-flex min-h-11 items-center text-label-bold underline underline-offset-4"
              >
                {t('mixedItemsSwitch', { item: nameOf(code) })}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
