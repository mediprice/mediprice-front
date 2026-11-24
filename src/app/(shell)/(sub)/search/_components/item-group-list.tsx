import { ChevronRight } from 'lucide-react';

import { useCategoryLabel } from '@/features/npay/use-category-label';
import type { ServiceRegion } from '@/features/regions/service-region';
import {
  groupHeadingParts,
  groupItemsByPages,
  partitionByPrice,
} from '@/features/search/item-groups';
import type { ItemResult } from '@/features/search/queries';

import { ItemRow } from './item-row';
import { KeepPhrase } from './keep-phrase';
import { ListSkeleton } from './list-skeleton';
import { UnpricedItems } from './unpriced-items';

/**
 * 가격이 있는 항목을 "분야 > 중분류" 머리 아래에 묶고, 그 지역에 가격이 없는 항목은 맨 아래 접힌 목록으로 모은다.
 * 가격 유무는 목록 조회 때 이미 알고 있고, 페이지마다 묶어 뒤에 붙이므로 "더 보기"를 눌러도 이미 본 행이 옮겨 가지 않는다.
 */
export function ItemGroupList({
  pages,
  region,
  headingAs: Heading = 'h2',
  omitSharedMajor = false,
  isFilling = false,
}: {
  /** 가격 있는 항목을 찾으려고 다음 페이지를 저절로 읽는 중이면 가격 없는 목록 대신 뼈대를 둔다(열림 상태가 미리 굳지 않게). */
  isFilling?: boolean;
  /** 받은 순서대로의 페이지. */
  pages: readonly (readonly ItemResult[])[];
  region: ServiceRegion;
  headingAs?: 'h2' | 'h3';
  /** 분류 화면처럼 대분류가 이미 제목에 있으면 묶음 머리마다 되풀이하지 않는다. */
  omitSharedMajor?: boolean;
}) {
  const label = useCategoryLabel();
  const parts = pages.map((page) => partitionByPrice(page));
  const groups = groupItemsByPages(parts.map((part) => part.priced));
  const unpriced = parts.flatMap((part) => part.unpriced);
  const hasPriced = groups.length > 0;
  const headings = groupHeadingParts(groups, { omitSharedMajor });

  return (
    <div className="space-y-4 lg:space-y-6">
      {groups.map((group, index) => {
        const heading = headings[index];
        return (
          <section key={group.key} className="space-y-2 lg:space-y-3">
            {heading && (
              <Heading className="flex min-h-6 flex-wrap items-center gap-x-1 pt-2 text-caption-bold text-text-secondary">
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
                    className="size-3.5"
                    strokeWidth={1.5}
                  />
                )}
                {heading.minor && <span>{heading.minor.name}</span>}
              </Heading>
            )}
            <ul className="divide-y divide-hairline overflow-hidden rounded-xl bg-bg px-4 lg:px-6 lg:shadow-card">
              {group.items.map((item) => (
                <li key={item.code}>
                  <ItemRow item={item} region={region} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {isFilling && !hasPriced ? (
        <ListSkeleton />
      ) : (
        unpriced.length > 0 && (
          <UnpricedItems
            items={unpriced}
            region={region}
            defaultOpen={!hasPriced}
          />
        )
      )}
    </div>
  );
}
