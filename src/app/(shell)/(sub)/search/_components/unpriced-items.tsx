import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { useCategoryLabel } from '@/features/npay/use-category-label';
import {
  regionQuery,
  type ServiceRegion,
} from '@/features/regions/service-region';
import { formatItemName } from '@/features/search/item-groups';
import type { ItemResult } from '@/features/search/queries';

import { KeepPhrase } from './keep-phrase';

/** 그 지역에 공개 가격이 없는 항목. 목록 맨 아래에 접어 두고, 펼치면 흐린 한 줄씩 보여 준다. */
export function UnpricedItems({
  items,
  region,
  isOpen,
}: {
  items: readonly ItemResult[];
  region: ServiceRegion;
  /** 가격 있는 항목이 하나도 없으면 펼쳐서 빈 화면처럼 보이지 않게 한다. */
  isOpen: boolean;
}) {
  const t = useTranslations('search.item');
  const tRegion = useTranslations('common.region');
  const label = useCategoryLabel();

  return (
    <details
      open={isOpen}
      className="group rounded-xl bg-bg lg:border lg:border-border"
    >
      <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 text-label text-text-secondary lg:px-6 [&::-webkit-details-marker]:hidden">
        {t('unpricedTitle', { count: items.length })}
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 text-text-tertiary transition-transform group-open:rotate-180"
          strokeWidth={1.75}
        />
      </summary>
      <p className="px-4 text-body-sm text-text-tertiary lg:px-6">
        {t.rich('unpricedHint', {
          region: tRegion(region),
          nb: (chunks) => <span className="whitespace-nowrap">{chunks}</span>,
        })}
      </p>
      <ul className="divide-y divide-hairline px-4 pt-1 pb-2 lg:px-6">
        {items.map((item) => (
          <li key={item.code}>
            <Link
              href={{
                pathname: `/items/${item.code}`,
                query: regionQuery(region),
              }}
              className="-mx-4 flex min-h-11 flex-col justify-center px-4 py-2 hover:bg-surface lg:-mx-6 lg:px-6"
            >
              <span className="text-label text-text-secondary">
                {formatItemName(item)}
              </span>
              {item.mdivName && (
                <span className="text-caption text-text-tertiary">
                  <KeepPhrase text={label(item.mdivCode, item.mdivName)} />
                  {item.sdivName &&
                    item.sdivName !== item.mdivName &&
                    ` · ${item.sdivName}`}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
