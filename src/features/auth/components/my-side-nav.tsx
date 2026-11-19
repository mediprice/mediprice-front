'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Tag } from '@/components/ui/tag';
import { cn } from '@/lib/utils';

import { useMyMenuItems } from './use-my-menu-items';

const itemClass =
  'flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-body [&_svg]:size-5 [&_svg]:shrink-0';

/** 데스크톱(lg 이상) 내 정보 화면의 옆 메뉴. 현재 항목은 굵기와 옅은 면으로 함께 알린다. 마이 홈은 경로가 같을 때만 현재 항목이다. */
export function MySideNav() {
  const t = useTranslations('mypage.menu');
  const pathname = usePathname();
  const items = useMyMenuItems();
  return (
    <nav
      aria-label={t('label')}
      className="hidden lg:sticky lg:top-[calc(var(--spacing-top-nav)+1.5rem)] lg:block"
    >
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.key}>
            {item.href ? (
              <Link
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
                className={cn(
                  itemClass,
                  'text-text-secondary transition-colors duration-200 ease-standard hover:bg-surface hover:text-text-primary aria-[current=page]:bg-primary-tint aria-[current=page]:font-bold aria-[current=page]:text-primary-text',
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
                <Tag>{t('comingSoon')}</Tag>
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
