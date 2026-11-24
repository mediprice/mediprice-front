'use client';

import { useEffect } from 'react';

import {
  type FillState,
  shouldFillPriced,
} from '@/features/search/fill-priced';

/**
 * 가격 없는 상위 코드가 앞에 몰려 있어도 "더 보기"를 여러 번 누르지 않게 가격 있는 항목이 나올 때까지 저절로 더 읽는다.
 * 다음 페이지는 쿼리가 미리 받아 둔다. 목록이 가격 있는 항목을 먼저 주면(백엔드 #24) 이어 읽지 않는다.
 */
export function useFillPriced(
  query: FillState & { fetchNextPage: () => unknown },
) {
  const { fetchNextPage, ...state } = query;
  const shouldFetch = shouldFillPriced(state);
  const hasPriced = state.pages.some((page) =>
    page.some((item) => item.hasPrice === true),
  );
  useEffect(() => {
    if (shouldFetch) void fetchNextPage();
  }, [shouldFetch, fetchNextPage]);
  return {
    isFilling: shouldFetch || (state.isFetchingNextPage && !hasPriced),
  };
}
