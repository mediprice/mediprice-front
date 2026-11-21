'use client';

import { List } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogTrigger,
} from '@/components/ui/responsive-dialog';

import type { TocEntry } from './legal-toc';

/** 긴 문서에서 본문 위 목차를 지나 내려가면 모바일 화면 아래에 떠서, 어디서든 목차 시트를 열어 다른 항목으로 건너가게 한다. */
export function FloatingToc({
  entries,
  anchorId,
}: {
  entries: TocEntry[];
  /** 본문 위 목차의 id. 이것이 화면 위로 지나가면 버튼이 보인다. */
  anchorId: string;
}) {
  const t = useTranslations('legal.document');
  const [isShown, setIsShown] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const targetRef = useRef<string | null>(null);

  useEffect(() => {
    const anchor = document.getElementById(anchorId);
    if (!anchor) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) {
        setIsShown(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      }
    });
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [anchorId]);

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={setIsOpen}>
      {(isShown || isOpen) && (
        <ResponsiveDialogTrigger className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-(--z-bottom-cta) inline-flex min-h-12 items-center gap-1.5 rounded-full border border-border bg-bg px-4 text-label-bold text-text-primary shadow-float active:bg-surface lg:hidden">
          <List aria-hidden="true" className="size-5" strokeWidth={1.75} />
          {t('toc')}
        </ResponsiveDialogTrigger>
      )}
      <ResponsiveDialogContent
        title={t('toc')}
        onCloseAutoFocus={(event) => {
          const id = targetRef.current;
          if (!id) return;
          event.preventDefault();
          targetRef.current = null;
          window.location.hash = id;
        }}
      >
        <nav aria-label={t('toc')}>
          <ol className="-mx-4 md:-mx-6">
            {entries.map((entry) => (
              <li key={entry.id}>
                <a
                  href={`#${entry.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    targetRef.current = entry.id;
                    setIsOpen(false);
                  }}
                  className="flex min-h-12 items-center px-4 py-2 text-body text-text-primary active:bg-surface md:px-6"
                >
                  {entry.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
