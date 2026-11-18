import { Heart, House, Sparkles, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { NavItem } from '@/components/layout/nav-item';

/** 데스크톱 TopNav와 모바일 BottomTabBar가 같은 목록을 쓴다. */
export function useNavItems(): NavItem[] {
  const t = useTranslations('nav');
  const icon = { 'aria-hidden': true, strokeWidth: 2 } as const;
  return [
    { href: '/', label: t('home'), icon: <House {...icon} /> },
    {
      href: '/ai',
      label: t('ai'),
      shortLabel: t('aiShort'),
      icon: <Sparkles {...icon} />,
    },
    { href: '/favorites', label: t('favorites'), icon: <Heart {...icon} /> },
    { href: '/my', label: t('my'), icon: <UserRound {...icon} /> },
  ];
}
