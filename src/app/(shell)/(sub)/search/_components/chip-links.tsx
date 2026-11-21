import type { Route } from 'next';
import Link from 'next/link';
import { type ComponentProps, useCallback } from 'react';

import { Chip } from '@/components/ui/chip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type ChipLink = {
  key: string;
  label: string;
  href: ComponentProps<typeof Link<Route>>['href'];
  isSelected?: boolean;
};

/** 분류를 고르는 칩 줄. 모바일은 가로로 밀고 오른쪽 끝을 흐리게 해 더 있음을 알린다(끝까지 밀면 여백만 흐려진다). lg부터 줄바꿈한다. */
export function ChipLinks({
  label,
  chips,
}: {
  label: string;
  chips: ChipLink[];
}) {
  const selectedKey = chips.find((chip) => chip.isSelected)?.key;
  /** 모바일 가로 줄에서 고른 칩이 화면 밖에 있으면 줄만 밀어 보이게 한다(페이지는 움직이지 않는다). */
  const revealSelected = useCallback(
    (list: HTMLUListElement | null) => {
      const selected = list?.querySelector('[aria-current="page"]');
      if (!list || !selected || selectedKey === undefined) return;
      const listBox = list.getBoundingClientRect();
      const chipBox = selected.getBoundingClientRect();
      if (chipBox.left >= listBox.left && chipBox.right <= listBox.right) {
        return;
      }
      list.scrollLeft += chipBox.left - listBox.left - listBox.width / 3;
    },
    [selectedKey],
  );

  return (
    <div className="space-y-2 pt-2">
      <h2 className="text-label-bold text-text-secondary">{label}</h2>
      <ul
        ref={revealSelected}
        className="-mx-page flex [scrollbar-width:none] gap-2 overflow-x-auto mask-r-from-[calc(100%-2rem)] py-1 px-page pr-8 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:mask-none lg:px-0"
      >
        {chips.map((chip) => (
          <li key={chip.key} className="shrink-0">
            <Chip asChild selected={chip.isSelected ?? false}>
              <Link
                href={chip.href}
                aria-current={chip.isSelected ? 'page' : undefined}
              >
                {chip.label}
              </Link>
            </Chip>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 분류 목록을 불러오는 동안 칩 줄과 같은 높이를 잡는다. */
export function ChipLinksSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-2 pt-2">
      <h2 className="text-label-bold text-text-secondary">{label}</h2>
      <div className="flex gap-2 overflow-hidden py-1">
        {['w-12', 'w-20', 'w-16', 'w-20'].map((width, index) => (
          <Skeleton
            key={index}
            className={cn('h-9 shrink-0 rounded-full', width)}
          />
        ))}
      </div>
    </div>
  );
}
