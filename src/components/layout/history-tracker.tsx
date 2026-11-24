'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { stampHistoryDepth } from '@/lib/navigation/history-depth';

/** 화면이 바뀔 때마다 기록 칸에 앱 안 깊이를 적는다. 상단 바의 뒤로 가기가 이 값을 본다. */
export function HistoryTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    stampHistoryDepth();
  }, [pathname, searchParams]);
  return null;
}
