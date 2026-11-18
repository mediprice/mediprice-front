import type { ReactNode } from 'react';

import { BottomTabBar } from '@/components/layout/bottom-tab-bar';
import { MobileTopBar } from '@/components/layout/mobile-top-bar';

import { useNavItems } from '../_components/use-nav-items';

export default function TabsLayout({ children }: { children: ReactNode }) {
  const navItems = useNavItems();
  return (
    <>
      <MobileTopBar />
      <main id="main" tabIndex={-1} className="pb-tab-bar outline-none lg:pb-0">
        {children}
      </main>
      <BottomTabBar items={navItems} />
    </>
  );
}
