import { ChevronRight } from 'lucide-react';

import { useCategoryLabel } from '@/features/npay/use-category-label';
import type { ServiceRegion } from '@/features/regions/service-region';
import {
  groupHeadingParts,
  groupItems,
  partitionByPrice,
} from '@/features/search/item-groups';
import type { ItemResult } from '@/features/search/queries';

import { ItemRow } from './item-row';
import { KeepPhrase } from './keep-phrase';
import { UnpricedItems } from './unpriced-items';

/**
 * 가격이 있는 항목을 "분야 > 중분류" 머리 아래에 묶고, 그 지역에 가격이 없는 항목은 맨 아래 접힌 목록으로 모은다.
 * 가격 유무는 목록 조회 때 이미 알고 있어 행이 나중에 옮겨 가지 않는다.
 */
export function ItemGroupList({
  items,
  region,
  headingAs: Heading = 'h2',
  omitSharedMajor = false,
}: {
  items: readonly ItemResult[];
  region: ServiceRegion;
  headingAs?: 'h2' | 'h3';
  /** 분류 화면처럼 대분류가 이미 제목에 있으면 묶음 머리마다 되풀이하지 않는다. */
  omitSharedMajor?: boolean;
}) {
  const label = useCategoryLabel();
  const { priced, unpriced } = partitionByPrice(items);
  const groups = groupItems(priced);
  const headings = groupHeadingParts(groups, { omitSharedMajor });

  return (
    <div className="space-y-6 lg:space-y-8">
      {groups.map((group, index) => {
        const heading = headings[index];
        return (
          <section key={group.key} className="space-y-1">
            {heading && (
              <Heading className="flex min-h-6 flex-wrap items-center gap-x-1 text-label-bold text-text-secondary">
                {heading.major && (
                  <span>
                    <KeepPhrase
                      text={label(heading.major.code, heading.major.name)}
                    />
                  </span>
                )}
                {heading.major && heading.minor && (
                  <ChevronRight
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.75}
                  />
                )}
                {heading.minor && <span>{heading.minor.name}</span>}
              </Heading>
            )}
            <ul className="divide-y divide-hairline border-b border-hairline">
              {group.items.map((item) => (
                <li key={item.code}>
                  <ItemRow item={item} region={region} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {unpriced.length > 0 && (
        <UnpricedItems
          items={unpriced}
          region={region}
          isOpen={priced.length === 0}
        />
      )}
    </div>
  );
}
