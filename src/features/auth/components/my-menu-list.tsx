import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Tag } from '@/components/ui/tag';
import { cn } from '@/lib/utils';

import { type MyMenuItem, useMyMenuItems } from './use-my-menu-items';

/** 모바일은 한 줄 목록, 데스크톱은 카드 격자. 같은 마크업을 CSS로만 바꾼다. */
export function MyMenuList() {
  const t = useTranslations('mypage.menu');
  const items = useMyMenuItems().filter((item) => item.key !== 'home');
  return (
    <ul className="flex flex-col divide-y divide-hairline lg:grid lg:grid-cols-3 lg:gap-4 lg:divide-y-0">
      {items.map((item) => (
        <li key={item.key}>
          {item.href ? (
            <Link
              href={item.href}
              className="group flex min-h-16 items-center gap-3 py-3 active:bg-surface lg:h-full lg:flex-col lg:items-start lg:gap-2 lg:rounded-xl lg:bg-bg lg:p-5 lg:shadow-card lg:hover:bg-surface"
            >
              <MenuContent item={item} />
              <ChevronRight
                aria-hidden="true"
                className="size-5 shrink-0 text-text-tertiary lg:hidden"
                strokeWidth={1.75}
              />
              <span
                aria-hidden="true"
                className="hidden items-center gap-0.5 text-label text-primary-text group-hover:underline lg:inline-flex"
              >
                {t('go')}
                <ChevronRight className="size-4" strokeWidth={1.75} />
              </span>
            </Link>
          ) : (
            <div
              aria-disabled="true"
              className="flex min-h-16 items-center gap-3 py-3 text-text-tertiary lg:h-full lg:flex-col lg:items-start lg:gap-2 lg:rounded-xl lg:bg-surface lg:p-5"
            >
              <MenuContent item={item} />
              <Tag>{t('comingSoon')}</Tag>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function MenuContent({ item }: { item: MyMenuItem }) {
  const t = useTranslations('mypage.menu.description');
  const isEnabled = item.href !== null;
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg]:size-5',
          isEnabled
            ? 'bg-primary-tint text-primary'
            : 'bg-surface-strong text-text-tertiary',
        )}
      >
        {item.icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            'text-body',
            isEnabled ? 'text-text-primary' : 'text-text-tertiary',
          )}
        >
          {item.label}
        </span>
        {item.key !== 'home' && (
          <span className="text-body-sm text-text-secondary">
            {t(item.key)}
          </span>
        )}
      </span>
    </>
  );
}
