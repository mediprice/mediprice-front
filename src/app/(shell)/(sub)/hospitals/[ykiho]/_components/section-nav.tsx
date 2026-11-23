'use client';

import { useTranslations } from 'next-intl';
import { type MouseEvent, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

const SECTIONS = ['prices', 'hours', 'location', 'reviews'] as const;
type SectionId = (typeof SECTIONS)[number];

/**
 * 구역 바로가기. 상단 바 아래에 붙어 있고, 화면 위쪽에 걸친 구역을 현재 위치로 표시한다.
 * 누르면 기록을 쌓지 않고 그 구역으로 스크롤과 포커스만 옮긴다(뒤로 가기가 이전 화면으로 바로 가게).
 */
export function SectionNav() {
  const t = useTranslations('hospitals.detail.nav');
  const [active, setActive] = useState<SectionId>('prices');

  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  /** 탭으로 옮긴 직후의 스크롤이 현재 위치를 다른 구역으로 덮어쓰지 않게 잠깐 고정한다. */
  const pinnedUntil = useRef(0);

  useEffect(() => {
    /** 탭 아래 선에 닿은 마지막 구역이 현재 위치다. 짧은 마지막 구역은 위에 닿지 못하므로 페이지 끝이면 마지막 탭을 켠다. */
    const update = () => {
      if (performance.now() < pinnedUntil.current) return;
      const line = (navRef.current?.getBoundingClientRect().bottom ?? 0) + 16;
      const root = document.documentElement;
      if (window.innerHeight + window.scrollY >= root.scrollHeight - 4) {
        setActive('reviews');
        return;
      }
      let current: SectionId = 'prices';
      for (const id of SECTIONS) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top != null && top <= line) current = id;
      }
      setActive(current);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  /** 글자가 커서 탭 줄이 옆으로 넘치면 켜진 탭이 보이게 줄을 민다. */
  useEffect(() => {
    const list = listRef.current;
    const link = list?.querySelector<HTMLElement>('[aria-current]');
    if (!list || !link) return;
    const left = link.offsetLeft - list.offsetLeft;
    const right = left + link.offsetWidth;
    if (left < list.scrollLeft) list.scrollLeft = left;
    else if (right > list.scrollLeft + list.clientWidth)
      list.scrollLeft = right - list.clientWidth;
  }, [active]);

  function jumpTo(event: MouseEvent<HTMLAnchorElement>, id: SectionId) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const section = document.getElementById(id);
    if (!section) return;
    event.preventDefault();
    section.scrollIntoView({ block: 'start' });
    if (!section.hasAttribute('tabindex'))
      section.setAttribute('tabindex', '-1');
    section.focus({ preventScroll: true });
    window.history.replaceState(window.history.state, '', `#${id}`);
    pinnedUntil.current = event.timeStamp + 500;
    setActive(id);
  }

  return (
    <nav
      ref={navRef}
      aria-label={t('label')}
      className="sticky top-[calc(var(--spacing-top-bar)+env(safe-area-inset-top,0px))] z-(--z-header) -mx-(--page-gutter) border-b border-border bg-bg px-(--page-gutter) lg:top-top-nav lg:mx-0 lg:px-0"
    >
      <ul
        ref={listRef}
        className="flex [scrollbar-width:none] overflow-x-auto lg:gap-8 lg:overflow-visible"
      >
        {SECTIONS.map((id) => (
          <li key={id} className="flex-1 shrink-0 lg:flex-none">
            <a
              href={`#${id}`}
              onClick={(event) => jumpTo(event, id)}
              aria-current={active === id ? 'location' : undefined}
              className={cn(
                'relative flex min-h-12 min-w-11 items-center justify-center px-3 text-label whitespace-nowrap text-text-secondary -outline-offset-4 hover:text-text-primary lg:justify-start lg:px-0',
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
