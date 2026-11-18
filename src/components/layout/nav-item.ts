import type { Route } from 'next';
import type { ReactNode } from 'react';

export type NavItem = {
  href: Route;
  label: string;
  /** 하단 탭바처럼 좁은 자리에서 쓰는 이름. 없으면 label을 쓴다. */
  shortLabel?: string;
  icon: ReactNode;
};
