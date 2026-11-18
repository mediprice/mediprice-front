import type { ReactNode } from 'react';

import { SkipLink } from '@/components/layout/skip-link';
import { TopNav } from '@/components/layout/top-nav';
import { AccountAction } from '@/features/auth/components/account-action';
import { AuthDialogs } from '@/features/auth/components/auth-dialogs';

import { useNavItems } from './_components/use-nav-items';

/** 셸 아래 라우트 그룹의 레이아웃이나 페이지는 본문을 <main id="main">으로 감싼다(SkipLink 대상). */
export default function ShellLayout({ children }: { children: ReactNode }) {
  const navItems = useNavItems();
  return (
    <>
      <SkipLink />
      <TopNav items={navItems} actions={<AccountAction />} />
      {children}
      <AuthDialogs />
    </>
  );
}
