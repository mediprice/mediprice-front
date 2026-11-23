'use client';

import {
  type CSSProperties,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';

import { CompareNumber } from '@/features/comparison/components/compare-number';
import type { ComparisonHospital } from '@/features/comparison/queries';
import { cn } from '@/lib/utils';

import { LABEL_CELL } from './price-row';

/**
 * 비교표 이름 행이 화면 위로 지나가면 상단 바 아래에 붙는 병원 이름 줄. 표가 가로로 스크롤되는 상자 안에 있어 머리 행을
 * sticky로 붙일 수 없으므로, 같은 열 폭의 복사본을 표 위에 겹쳐 두고 가로 위치를 표와 맞춘다. 표 머리 행이 실제 머리라 낭독기에는 숨긴다.
 */
export function StickyNames({
  hospitals,
  slots,
  label,
  tableStyle,
  tableClassName,
  scrollerRef,
  headRowRef,
}: {
  hospitals: readonly ComparisonHospital[];
  slots: number;
  label: string;
  tableStyle: CSSProperties;
  tableClassName: string;
  scrollerRef: RefObject<HTMLDivElement | null>;
  headRowRef: RefObject<HTMLTableRowElement | null>;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement>(null);
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const headRow = headRowRef.current;
    const anchor = anchorRef.current;
    if (!scroller || !headRow || !anchor) return;
    let frame = 0;
    const syncX = () => {
      if (cloneRef.current) cloneRef.current.scrollLeft = scroller.scrollLeft;
    };
    const update = () => {
      frame = 0;
      const line = anchor.getBoundingClientRect().top;
      const cloneHeight = cloneRef.current?.offsetHeight ?? 0;
      const tableBottom = scroller.getBoundingClientRect().bottom;
      setIsShown(
        headRow.getBoundingClientRect().bottom <= line &&
          tableBottom > line + cloneHeight + 48,
      );
      syncX();
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    scroller.addEventListener('scroll', syncX, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      scroller.removeEventListener('scroll', syncX);
    };
  }, [scrollerRef, headRowRef]);

  useEffect(() => {
    if (isShown && cloneRef.current && scrollerRef.current) {
      cloneRef.current.scrollLeft = scrollerRef.current.scrollLeft;
    }
  }, [isShown, scrollerRef]);

  return (
    <div
      ref={anchorRef}
      aria-hidden="true"
      className="sticky top-[calc(var(--spacing-top-bar)+env(safe-area-inset-top,0px))] z-(--z-header) h-0 lg:top-top-nav"
    >
      <div
        ref={cloneRef}
        className={cn(
          'overflow-hidden border-x border-b border-hairline bg-bg shadow-card',
          !isShown && 'invisible',
        )}
      >
        <table style={tableStyle} className={tableClassName}>
          <colgroup>
            <col className="w-20 md:w-32 lg:w-47.5" />
            {hospitals.map((hospital) => (
              <col key={hospital.ykiho} />
            ))}
            {Array.from({ length: slots }, (_, index) => (
              <col key={index} className="w-0 lg:w-auto" />
            ))}
          </colgroup>
          <tbody>
            <tr>
              <td className={LABEL_CELL}>{label}</td>
              {hospitals.map((hospital, index) => (
                <td key={hospital.ykiho} className="p-3 align-top lg:px-6">
                  <span className="flex items-start gap-2">
                    <CompareNumber value={index + 1} size="sm" />
                    <span className="line-clamp-2 min-w-0 flex-1 pt-0.5 text-label-bold break-keep text-text-primary">
                      {hospital.name}
                    </span>
                  </span>
                </td>
              ))}
              {Array.from({ length: slots }, (_, index) => (
                <td key={index} className="hidden lg:table-cell" />
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
