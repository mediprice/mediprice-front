'use client';

import { ChevronUp, CircleAlert, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type CSSProperties, useEffect, useRef, useState } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { MAX_COMPARE } from '@/features/comparison/compare-params';
import {
  buildBasketHref,
  useCompareStore,
} from '@/features/comparison/compare-store';
import { isTrayHiddenOn } from '@/features/comparison/tray-visibility';

import { ClearCompareDialog } from './clear-compare-dialog';
import { CompareAnnouncer } from './compare-announcer';
import { CompareNumber } from './compare-number';
import { CompareTraySheet } from './compare-tray-sheet';
import { useCoveredHeight } from './use-covered-height';

const FULL_NOTICE_MS = 5000;

/**
 * 하위 화면 아래에 고정되는 비교함. 모바일은 safe-area 위 전체 폭 바, 데스크톱은 본문 폭의 떠 있는 바다.
 * 비교·지도·내 정보·법적 문서 화면에서는 숨긴다(isTrayHiddenOn). 본문 끝에 바 높이만큼 여백을 둬서 내용을 가리지 않는다.
 * 병원별 칩이 없는 배치(모바일·큰 글자)에서는 "비교함 n/3"을 눌러 시트에서 한 곳씩 뺀다. 모바일에서 글을 입력하는 동안에는 탭바처럼 숨는다.
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isVisible = hospitals.length > 0 && !isTrayHiddenOn(pathname);
  const coveredHeight = useCoveredHeight(barRef, isVisible);
  /** CSSProperties 타입이 CSS 변수(--x)를 몰라 단언한다. */
  const trayHeight = { '--tray-h': `${coveredHeight}px` } as CSSProperties;
  const isFull = notice?.kind === 'full' && notice.id !== dismissedNotice;
  const canCompare = hospitals.length >= 2;
  const names = hospitals.map((hospital) => hospital.name).join(' · ');

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
            style={trayHeight}
            className="h-(--tray-h) bg-surface"
          />
          <aside
            ref={barRef}
            aria-label={t('label')}
            className="fixed inset-x-0 bottom-0 z-(--z-bottom-cta) border-t border-hairline bg-bg pb-safe shadow-bar lg:pointer-events-none lg:bottom-6 lg:border-0 lg:bg-transparent lg:pb-0 lg:shadow-none max-lg:[body:has(:is(textarea,input:not([type=checkbox],[type=radio],[type=button],[type=submit])):focus)_&]:hidden"
          >
            <PageContainer className="lg:px-page">
              {isFull && (
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-2.5 lg:hidden">
                  <p className="flex min-w-0 flex-[1_1_12rem] items-start gap-1.5 text-body-sm text-warning">
                    <CircleAlert
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                      strokeWidth={1.75}
                    />
                    {t('full', { max: MAX_COMPARE })}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSheetOpen(true)}
                  >
                    {t('manage')}
                  </Button>
                </div>
              )}
              {/**
               * 정보가 남는 폭을 거의 다 가져가서, 큰 글자로 줄이 나뉠 때만 비교하기가 한 줄을 다 쓴다.
               * 컨테이너 쿼리 단위가 rem이라 글자를 키웠을 때만 좁은 배치가 된다: 모바일은 이름을 한 줄로, 데스크톱은 칩 대신 이름 한 줄로.
               */}
              <div className="@container/tray flex flex-wrap items-center gap-2 py-3 lg:pointer-events-auto lg:gap-x-4 lg:rounded-xl lg:border lg:border-primary lg:bg-bg lg:py-3 lg:pr-3 lg:pl-6 lg:shadow-float">
                <div className="flex min-w-0 flex-[999_1_12rem] flex-col lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-4 lg:gap-y-2">
                  <CompareTraySheet
                    hospitals={hospitals}
                    isOpen={isSheetOpen}
                    onOpenChange={setIsSheetOpen}
                    onRemove={remove}
                  >
                    <button
                      type="button"
                      className="touch-target -ml-1.5 inline-flex min-h-7 w-fit shrink-0 items-center gap-1 rounded-md px-1.5 text-label-bold whitespace-nowrap text-text-primary tabular-nums active:bg-surface lg:@min-[48rem]/tray:hidden"
                    >
                      {t('count', {
                        count: hospitals.length,
                        max: MAX_COMPARE,
                      })}
                      <ChevronUp
                        aria-hidden="true"
                        className="size-4 text-text-secondary"
                        strokeWidth={2}
                      />
                    </button>
                  </CompareTraySheet>
                  <p
                    ref={countRef}
                    tabIndex={-1}
                    className="hidden shrink-0 text-label-bold whitespace-nowrap text-text-primary tabular-nums outline-none lg:@min-[48rem]/tray:block"
                  >
                    {t('count', {
                      count: hospitals.length,
                      max: MAX_COMPARE,
                    })}
                  </p>
                  <p
                    title={canCompare ? names : undefined}
                    className="line-clamp-2 text-body-sm break-keep text-text-secondary lg:line-clamp-1 @max-[16rem]/tray:line-clamp-1 lg:@min-[48rem]/tray:hidden"
                  >
                    {canCompare
                      ? names
                      : t('needMore', { count: 2 - hospitals.length })}
                  </p>
                  <ul className="hidden min-w-0 flex-wrap items-center gap-2 lg:@min-[48rem]/tray:flex">
                    {hospitals.map((hospital, index) => (
                      <li
                        key={hospital.ykiho}
                        className="inline-flex h-9 max-w-60 items-center gap-1 rounded-full border border-border bg-bg pr-1 pl-1.5 text-body-sm text-text-primary"
                      >
                        <CompareNumber value={index + 1} size="sm" />
                        <span title={hospital.name} className="truncate">
                          {hospital.name}
                        </span>
                        <button
                          type="button"
                          aria-label={t('remove', { name: hospital.name })}
                          onClick={() => handleRemove(hospital.ykiho)}
                          className="touch-target flex size-7 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface active:bg-surface-strong"
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
                      <p className="hidden text-body-sm text-text-secondary lg:@min-[48rem]/tray:block">
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
                  <Button asChild size="md" elevated className="grow">
                    <Link href={buildBasketHref(hospitals)}>
                      {t('compare')}
                    </Link>
                  </Button>
                ) : (
                  <Button size="md" disabled className="grow">
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
