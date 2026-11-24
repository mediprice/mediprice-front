'use client';

import { useTranslations } from 'next-intl';

import { MAX_COMPARE } from '@/features/comparison/compare-params';
import { useCompareStore } from '@/features/comparison/compare-store';

/** 비교함 변화를 스크린 리더에 알린다. 알림 영역이 먼저 있어야 읽히므로 비교함이 비어 있어도 항상 렌더한다. */
export function CompareAnnouncer() {
  const t = useTranslations('comparison.announce');
  const notice = useCompareStore((state) => state.notice);
  const values = {
    name: notice?.name ?? '',
    count: notice?.count ?? 0,
    max: MAX_COMPARE,
  };

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {notice && <p key={notice.id}>{t(notice.kind, values)}</p>}
    </div>
  );
}
