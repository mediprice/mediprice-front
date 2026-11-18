import type { ReactNode } from 'react';

import { BottomTabBar } from '@/components/layout/bottom-tab-bar';
import { MobileTopBar } from '@/components/layout/mobile-top-bar';
import { SiteFooter } from '@/components/layout/site-footer';

import { useNavItems } from '../_components/use-nav-items';

export default function TabsLayout({ children }: { children: ReactNode }) {
  const navItems = useNavItems();
  return (
    <>
      <MobileTopBar />
      <div className="pb-tab-bar lg:pb-0">
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter />
      </div>
      <BottomTabBar items={navItems} />
    </>
  );
}
