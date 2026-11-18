import {
  Activity,
  Clock,
  Heart,
  PenLine,
  UserRound,
  UserRoundCog,
} from 'lucide-react';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

export type MyMenuKey =
  'home' | 'medicalProfile' | 'favorites' | 'history' | 'reviews' | 'account';

/** 마이 홈에서 메뉴를 나눠 보여 줄 묶음. 홈 자신은 옆 메뉴에만 있다. */
export type MyMenuGroup = 'records' | 'settings';

export type MyMenuItem = {
  key: MyMenuKey;
  group: MyMenuGroup | null;
  /** 화면이 아직 없으면 null이고 "준비 중"으로 보인다(typedRoutes가 없는 경로를 막는다). */
  href: Route | null;
  label: string;
  icon: ReactNode;
};

/** 마이 홈 메뉴와 데스크톱 옆 메뉴가 같은 목록을 쓴다. 화면이 생기면 href를 채운다. */
export function useMyMenuItems(): MyMenuItem[] {
  const t = useTranslations('mypage.menu');
  const icon = { 'aria-hidden': true, strokeWidth: 1.75 } as const;
  return [
    {
      key: 'home',
      group: null,
      href: '/my',
      label: t('home'),
      icon: <UserRound {...icon} />,
    },
    {
      key: 'medicalProfile',
      group: 'settings',
      href: '/my/medical-profile',
      label: t('medicalProfile'),
      icon: <Activity {...icon} />,
    },
    {
      key: 'favorites',
      group: 'records',
      href: '/favorites',
      label: t('favorites'),
      icon: <Heart {...icon} />,
    },
    {
      key: 'history',
      group: 'records',
      href: '/my/history',
      label: t('history'),
      icon: <Clock {...icon} />,
    },
    {
      key: 'reviews',
      group: 'records',
      href: '/my/reviews',
      label: t('reviews'),
      icon: <PenLine {...icon} />,
    },
    {
      key: 'account',
      group: 'settings',
      href: '/my/account',
      label: t('account'),
      icon: <UserRoundCog {...icon} />,
    },
  ];
}
