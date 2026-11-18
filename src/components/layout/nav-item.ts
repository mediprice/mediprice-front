import type { Route } from 'next';
import type { ReactNode } from 'react';

export type NavItem = {
  href: Route;
  label: string;
  icon: ReactNode;
};
