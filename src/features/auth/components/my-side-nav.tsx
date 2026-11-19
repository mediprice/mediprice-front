'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Tag } from '@/components/ui/tag';
import { cn } from '@/lib/utils';

import { useMyMenuItems } from './use-my-menu-items';

const itemClass =
  'flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-label [&_svg]:size-4.5 [&_svg]:shrink-0';

/** 데스크톱(lg 이상) 내 정보 화면의 옆 메뉴. 마이 홈은 하위 화면에서 함께 활성화되지 않게 경로가 같을 때만 현재 항목이다. */
export function MySideNav() {
  const t = useTranslations('mypage.menu');
  const pathname = usePathname();
  const items = useMyMenuItems();
  return (
    <nav
      aria-label={t('label')}
      className="hidden rounded-xl bg-surface p-2 lg:block"
    >
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => (
          <li key={item.key}>
            {item.href ? (
              <Link
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
                className={cn(
                  itemClass,
                  'text-text-secondary hover:bg-surface-strong hover:text-text-primary aria-[current=page]:bg-bg aria-[current=page]:text-label-bold aria-[current=page]:text-primary-text',
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className={cn(itemClass, 'text-text-tertiary')}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                <Tag className="px-1.5 py-0.5">{t('comingSoon')}</Tag>
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
