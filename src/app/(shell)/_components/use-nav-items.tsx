import { Heart, Sparkles, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { NavItem } from '@/components/layout/nav-item';

import { HouseIcon } from './house-icon';

/** 데스크톱 TopNav와 모바일 BottomTabBar가 같은 목록과 이름을 쓴다. 활성 탭은 아이콘을 채우므로 집은 문을 비워 모양을 지킨다. */
export function useNavItems(): NavItem[] {
  const t = useTranslations('nav');
  const icon = { 'aria-hidden': true, strokeWidth: 2 } as const;
  return [
    {
      href: '/',
      label: t('home'),
      icon: (
        <HouseIcon
          {...icon}
          className="in-aria-[current=page]:[&>path:last-child]:fill-bg"
        />
      ),
    },
    { href: '/ai', label: t('ai'), icon: <Sparkles {...icon} /> },
    { href: '/favorites', label: t('favorites'), icon: <Heart {...icon} /> },
    { href: '/my', label: t('my'), icon: <UserRound {...icon} /> },
  ];
}
