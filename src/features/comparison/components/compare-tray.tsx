'use client';

import { CircleAlert, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type CSSProperties, useEffect, useRef, useState } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { MAX_COMPARE } from '../compare-params';
import { buildBasketHref, useCompareStore } from '../compare-store';
import { ClearCompareDialog } from './clear-compare-dialog';
import { CompareAnnouncer } from './compare-announcer';
import { CompareNumber } from './compare-number';
import { useCoveredHeight } from './use-covered-height';

const FULL_NOTICE_MS = 5000;

/**
 * 하위 화면 아래에 고정되는 비교함. 모바일은 safe-area 위 전체 폭 바, 데스크톱은 본문 폭의 떠 있는 바다.
 * 비교 화면에서는 주소가 비교 대상이라 숨긴다. 본문 끝에 바 높이만큼 여백을 둬서 내용을 가리지 않는다.
 */
export function CompareTray() {
  const t = useTranslations('comparison.tray');
  const pathname = usePathname();
  const hospitals = useCompareStore((state) => state.hospitals);
  const notice = useCompareStore((state) => state.notice);
  const remove = useCompareStore((state) => state.remove);
  const clear = useCompareStore((state) => state.clear);
  const barRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLParagraphElement>(null);
  const [dismissedNotice, setDismissedNotice] = useState(0);
  /** 지도 화면은 지도와 목록이 화면 높이를 꽉 채워서 바가 둘을 가린다. */
  const isVisible =
    hospitals.length > 0 && pathname !== '/compare' && pathname !== '/map';
  const coveredHeight = useCoveredHeight(barRef, isVisible);
  const isFull = notice?.kind === 'full' && notice.id !== dismissedNotice;
  const canCompare = hospitals.length >= 2;

  useEffect(() => {
    void useCompareStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (notice?.kind !== 'full') return;
    const timer = window.setTimeout(
      () => setDismissedNotice(notice.id),
      FULL_NOTICE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [notice]);

  function handleRemove(ykiho: string) {
    remove(ykiho);
    countRef.current?.focus();
  }

  return (
    <>
      <CompareAnnouncer />
      {isVisible && (
        <>
          <div
            aria-hidden="true"
            style={{ '--tray-h': `${coveredHeight}px` } as CSSProperties}
            className="h-(--tray-h) bg-surface"
          />
          <aside
            ref={barRef}
            aria-label={t('label')}
            className="fixed inset-x-0 bottom-0 z-(--z-bottom-cta) border-t border-border bg-bg pb-safe shadow-bar lg:pointer-events-none lg:bottom-6 lg:border-0 lg:bg-transparent lg:pb-0 lg:shadow-none"
          >
            <PageContainer className="lg:px-page">
              {isFull && (
                <p className="flex items-start gap-1.5 pt-2.5 text-body-sm text-warning lg:hidden">
                  <CircleAlert
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                    strokeWidth={1.75}
                  />
                  {t('full', { max: MAX_COMPARE })}
                </p>
              )}
              <div className="flex items-center gap-2 py-3 lg:pointer-events-auto lg:gap-4 lg:rounded-2xl lg:border lg:border-border lg:bg-bg lg:py-3 lg:pr-3 lg:pl-5 lg:shadow-float">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 lg:flex-row lg:items-center lg:gap-4">
                  <div className="flex shrink-0 items-center gap-2">
                    <p
                      ref={countRef}
                      tabIndex={-1}
                      className="text-label-bold text-text-primary tabular-nums outline-none"
                    >
                      {t('count', {
                        count: hospitals.length,
                        max: MAX_COMPARE,
                      })}
                    </p>
                    <span aria-hidden="true" className="flex gap-1">
                      {Array.from({ length: MAX_COMPARE }, (_, index) => (
                        <span
                          key={index}
                          className={cn(
                            'h-1.5 w-4 rounded-full',
                            index < hospitals.length
                              ? 'bg-primary'
                              : 'bg-surface-strong',
                          )}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="truncate text-body-sm text-text-secondary lg:hidden">
                    {canCompare
                      ? hospitals.map((hospital) => hospital.name).join(' · ')
                      : t('needMore', { count: 2 - hospitals.length })}
                  </p>
                  <ul className="hidden min-w-0 flex-wrap items-center gap-2 lg:flex">
                    {hospitals.map((hospital, index) => (
                      <li
                        key={hospital.ykiho}
                        className="inline-flex h-10 max-w-64 items-center gap-2 rounded-full bg-surface pr-1 pl-1.5 text-body-sm text-text-primary"
                      >
                        <CompareNumber value={index + 1} size="sm" />
                        <span className="truncate">{hospital.name}</span>
                        <button
                          type="button"
                          aria-label={t('remove', { name: hospital.name })}
                          onClick={() => handleRemove(hospital.ykiho)}
                          className="touch-target flex size-8 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-strong active:bg-border"
                        >
                          <X
                            aria-hidden="true"
                            className="size-4"
                            strokeWidth={1.75}
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                  {isFull ? (
                    <p className="hidden items-center gap-1.5 text-body-sm text-warning lg:flex">
                      <CircleAlert
                        aria-hidden="true"
                        className="size-4 shrink-0"
                        strokeWidth={1.75}
                      />
                      {t('full', { max: MAX_COMPARE })}
                    </p>
                  ) : (
                    !canCompare && (
                      <p className="hidden text-body-sm text-text-secondary lg:block">
                        {t('needMore', { count: 2 - hospitals.length })}
                      </p>
                    )
                  )}
                </div>
                <ClearCompareDialog count={hospitals.length} onConfirm={clear}>
                  <Button variant="ghost" size="sm">
                    {t('clear')}
                  </Button>
                </ClearCompareDialog>
                {canCompare ? (
                  <Button asChild size="md" elevated>
                    <Link href={buildBasketHref(hospitals)}>
                      {t('compare')}
                    </Link>
                  </Button>
                ) : (
                  <Button size="md" disabled>
                    {t('compare')}
                  </Button>
                )}
              </div>
            </PageContainer>
          </aside>
        </>
      )}
    </>
  );
}
