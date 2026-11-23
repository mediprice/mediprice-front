import type { ReactNode } from 'react';

import { useNavItems } from '@/app/(shell)/_components/use-nav-items';
import { BottomTabBar } from '@/components/layout/bottom-tab-bar';
import { MobileTopBar } from '@/components/layout/mobile-top-bar';
import { SiteFooter } from '@/components/layout/site-footer';
import { AccountAction } from '@/features/auth/components/account-action';

export default function TabsLayout({ children }: { children: ReactNode }) {
  const navItems = useNavItems();
  return (
    <>
      <MobileTopBar actions={<AccountAction compact />} />
      <div className="flex min-h-[calc(100dvh-var(--spacing-top-bar))] flex-col lg:min-h-[calc(100dvh-var(--spacing-top-nav))]">
        <main
          id="main"
          tabIndex={-1}
          className="flex flex-1 flex-col outline-none"
        >
          {children}
        </main>
        <SiteFooter className="pb-tab-bar lg:pb-0" />
      </div>
      <BottomTabBar items={navItems} />
    </>
  );
}
