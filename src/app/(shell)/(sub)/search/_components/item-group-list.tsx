import { ChevronRight } from 'lucide-react';

import type { ServiceRegion } from '@/features/regions/service-region';
import { groupItems, partitionByPrice } from '@/features/search/item-groups';
import type { ItemResult } from '@/features/search/queries';

import { ItemRow } from './item-row';
import { UnpricedItems } from './unpriced-items';
import { useCategoryLabel } from './use-category-label';

/**
 * 가격이 있는 항목을 "분야 > 중분류" 머리 아래에 묶고, 그 지역에 가격이 없는 항목은 맨 아래 접힌 목록으로 모은다.
 * 가격 유무는 목록 조회 때 이미 알고 있어 행이 나중에 옮겨 가지 않는다.
 */
export function ItemGroupList({
  items,
  region,
  headingAs: Heading = 'h2',
}: {
  items: readonly ItemResult[];
  region: ServiceRegion;
  headingAs?: 'h2' | 'h3';
}) {
  const label = useCategoryLabel();
  const { priced, unpriced } = partitionByPrice(items);

  return (
    <div className="space-y-4 lg:space-y-6">
      {groupItems(priced).map((group) => (
        <section key={group.key} className="space-y-2 lg:space-y-3">
          <Heading className="flex min-h-6 flex-wrap items-center gap-x-1 pt-2 text-caption-bold text-text-secondary">
            {group.major && (
              <span>{label(group.major.code, group.major.name)}</span>
            )}
            {group.major && group.minor && (
              <ChevronRight
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={1.5}
              />
            )}
            {group.minor && <span>{group.minor.name}</span>}
          </Heading>
          <ul className="divide-y divide-hairline overflow-hidden rounded-xl bg-bg px-4 lg:px-6 lg:shadow-card">
            {group.items.map((item) => (
              <li key={item.code}>
                <ItemRow item={item} region={region} />
              </li>
            ))}
          </ul>
        </section>
      ))}
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
