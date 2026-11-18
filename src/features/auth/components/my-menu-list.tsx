import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Reveal } from '@/components/ui/reveal';
import { Tag } from '@/components/ui/tag';

import {
  type MyMenuGroup,
  type MyMenuItem,
  type MyMenuKey,
  useMyMenuItems,
} from './use-my-menu-items';

const GROUPS = ['records', 'settings'] as const satisfies MyMenuGroup[];

type CountKey = Extract<MyMenuKey, 'favorites' | 'history' | 'reviews'>;

/** 마이 홈 메뉴. 큰 줄(64px 이상)과 구분선, 오른쪽 화살표로 된 목록이다. 데스크톱은 두 묶음을 나란히 둔다. */
export function MyMenuList({
  counts = {},
}: {
  /** 불러온 개수만 줄 오른쪽에 보인다. */
  counts?: Partial<Record<CountKey, number>>;
}) {
  const t = useTranslations('mypage.menu');
  const items = useMyMenuItems();
  return (
    <div className="flex flex-col gap-10 lg:grid lg:grid-cols-2 lg:gap-12">
      {GROUPS.map((group, index) => (
        <Reveal
          key={group}
          delayMs={index * 80}
          className="flex flex-col"
          asChild
        >
          <section aria-labelledby={`my-menu-${group}`}>
            <h2
              id={`my-menu-${group}`}
              className="pb-2 text-label-bold text-text-secondary"
            >
              {t(`groups.${group}`)}
            </h2>
            <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
              {items
                .filter((item) => item.group === group)
                .map((item) => (
                  <li key={item.key}>
                    <MenuRow
                      item={item}
                      count={
                        isCountKey(item.key) ? counts[item.key] : undefined
                      }
                    />
                  </li>
                ))}
            </ul>
          </section>
        </Reveal>
      ))}
    </div>
  );
}

function isCountKey(key: MyMenuKey): key is CountKey {
  return key === 'favorites' || key === 'history' || key === 'reviews';
}

function MenuRow({ item, count }: { item: MyMenuItem; count?: number }) {
  const t = useTranslations('mypage.menu');
  const content = (
    <>
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary [&_svg]:size-5.5"
      >
        {item.icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-subheading">{item.label}</span>
        {item.key !== 'home' && (
          <span className="text-body-sm text-text-secondary">
            {t(`description.${item.key}`)}
          </span>
        )}
      </span>
    </>
  );

  if (!item.href) {
    return (
      <div
        aria-disabled="true"
        className="flex min-h-18 items-center gap-4 py-3 text-text-tertiary"
      >
        {content}
        <Tag>{t('comingSoon')}</Tag>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className="group -mx-3 flex min-h-18 items-center gap-4 rounded-xl px-3 py-3 transition-colors duration-200 ease-standard hover:bg-surface active:bg-surface-strong"
    >
      {content}
      {count !== undefined && isCountKey(item.key) && (
        <span className="shrink-0 text-label-bold text-text-primary tabular-nums">
          {t(`count.${item.key}`, { count })}
        </span>
      )}
      <ChevronRight
        aria-hidden="true"
        className="size-5 shrink-0 text-text-tertiary transition-transform duration-200 ease-standard group-hover:translate-x-0.5 motion-reduce:transition-none"
        strokeWidth={1.75}
      />
    </Link>
  );
}
