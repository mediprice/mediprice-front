import type { Route } from 'next';
import Link from 'next/link';
import { type ComponentProps, useCallback } from 'react';

import { Chip } from '@/components/ui/chip';

type ChipLink = {
  key: string;
  label: string;
  href: ComponentProps<typeof Link<Route>>['href'];
  isSelected?: boolean;
};

/** 분류를 고르는 칩 줄. 모바일은 가로로 밀고 lg부터 줄바꿈한다. 고른 칩은 aria-current로 알린다. */
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
        className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 py-1 md:-mx-6 md:px-6 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0"
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
