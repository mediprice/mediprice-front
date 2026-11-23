'use client';

import { History } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Chip } from '@/components/ui/chip';
import { clearRecentItems } from '@/features/recent-items/recent-items';
import { useRecentItems } from '@/features/recent-items/use-recent-items';

/** 다시 온 사람을 위한 최근 본 항목. 이 기기에만 있고 로그인 기록과는 별개다. 서버 렌더에서는 비어 있다. */
export function RecentItemChips() {
  const t = useTranslations('home.recent');
  const items = useRecentItems();
  if (items.length === 0) return null;

  return (
    <nav
      aria-labelledby="home-recent-title"
      className="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-2 md:max-w-3xl lg:justify-center"
    >
      <h2
        id="home-recent-title"
        className="flex items-center gap-1 text-caption-strong text-text-secondary"
      >
        <History aria-hidden="true" className="size-4" strokeWidth={1.75} />
        {t('title')}
      </h2>
      <ul className="flex min-w-0 flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.code} className="min-w-0">
            <Chip asChild className="max-w-full">
              <Link href={`/items/${encodeURIComponent(item.code)}`}>
                <span className="truncate">{item.name}</span>
              </Link>
            </Chip>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => clearRecentItems()}
        className="touch-target inline-flex min-h-9 items-center rounded-md px-1.5 text-caption-strong text-text-secondary underline underline-offset-4 hover:text-text-primary"
      >
        {t('clear')}
      </button>
    </nav>
  );
}
