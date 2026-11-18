import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';

import { groupItems } from '@/features/search/item-groups';
import type { Region } from '@/features/search/search-params';
import type { components } from '@/lib/api/schema';

import { ItemRow } from './item-row';

type NpayItem = components['schemas']['NpayItemResponse'];

/** 대분류 > 중분류 머리 아래에 항목을 묶어 보여 준다(Figma "그룹 머리"). */
export function ItemGroupList({
  items,
  region,
  headingAs: Heading = 'h2',
}: {
  items: readonly NpayItem[];
  region: Region;
  headingAs?: 'h2' | 'h3';
}) {
  return (
    <div className="space-y-4 lg:space-y-6">
      {groupItems(items).map((group) => (
        <section key={group.key} className="space-y-2 lg:space-y-3">
          <Heading className="flex flex-wrap items-center gap-x-1 pt-2 text-caption-bold text-text-secondary">
            {group.path.map((name, index) => (
              <Fragment key={name}>
                {index > 0 && (
                  <ChevronRight
                    aria-hidden="true"
                    className="size-3.5"
                    strokeWidth={1.5}
                  />
                )}
                <span>{name}</span>
              </Fragment>
            ))}
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
    </div>
  );
}
