'use client';

import { CircleCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import type { ReviewNoticeKind } from '@/features/reviews/review-notice';

/** 후기 작성·수정·삭제 결과. 나타날 때 화면에 보이게 옮기고 포커스를 받아 스크린 리더가 읽는다. */
export function ReviewNoticeBanner({ kind }: { kind: ReviewNoticeKind }) {
  const t = useTranslations('reviews.notice');
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ block: 'center' });
      ref.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [kind]);

  return (
    <p
      ref={ref}
      role="status"
      tabIndex={-1}
      className="flex items-center gap-2 rounded-xl bg-positive-tint px-4 py-3 text-label text-text-primary outline-none"
    >
      <CircleCheck
        aria-hidden="true"
        className="size-5 shrink-0 text-positive"
        strokeWidth={1.75}
      />
      {t(kind)}
    </p>
  );
}
