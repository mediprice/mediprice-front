'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

const SECTIONS = ['prices', 'hours', 'location', 'reviews'] as const;
type SectionId = (typeof SECTIONS)[number];

/** 구역 바로가기. 상단 바 아래에 붙어 있고, 화면 위쪽에 걸친 구역을 현재 위치로 표시한다. */
export function SectionNav() {
  const t = useTranslations('hospitals.detail.nav');
  const [active, setActive] = useState<SectionId>('prices');

  useEffect(() => {
    const elements = SECTIONS.map((id) => document.getElementById(id)).filter(
      (element): element is HTMLElement => element !== null,
    );
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = SECTIONS.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      { rootMargin: '-120px 0px -55% 0px' },
    );
    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label={t('label')}
      className="sticky top-[calc(var(--spacing-top-bar)+env(safe-area-inset-top,0px))] z-(--z-header) -mx-(--page-gutter) border-b border-border bg-bg px-(--page-gutter) lg:top-top-nav lg:mx-0 lg:px-0"
    >
      <ul className="grid grid-cols-4 lg:flex lg:gap-8">
        {SECTIONS.map((id) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={active === id ? 'location' : undefined}
              onClick={() => setActive(id)}
              className={cn(
                'relative flex min-h-12 items-center justify-center text-label text-text-secondary -outline-offset-4 hover:text-text-primary lg:justify-start',
                'after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary after:opacity-0',
                'aria-[current=location]:text-label-bold aria-[current=location]:text-primary-text aria-[current=location]:after:opacity-100',
              )}
            >
              {t(id)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
