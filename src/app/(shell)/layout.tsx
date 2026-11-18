import type { ReactNode } from 'react';

import { TopNav } from '@/components/layout/top-nav';

import { useNavItems } from './_components/use-nav-items';

export default function ShellLayout({ children }: { children: ReactNode }) {
  const navItems = useNavItems();
  return (
    <>
      <TopNav items={navItems} />
      {children}
    </>
  );
}
