'use client';

import { useEffect } from 'react';

import { type ItemResult, MAX_AUTO_PAGES } from '@/features/search/queries';

/**
 * 가격 없는 상위 코드가 앞에 몰려 있어도 "더 보기"를 여러 번 누르지 않게, 받은 페이지에 그 지역 가격이 있는 항목이
 * 하나도 없으면 다음 페이지를 저절로 읽는다(최대 MAX_AUTO_PAGES페이지). 다음 페이지는 쿼리가 미리 받아 둔다.
 * 목록이 가격 있는 항목을 먼저 주면(백엔드 #24) 호출부가 hasNextPage를 mayFindMorePriced로 좁혀 연쇄가 생기지 않는다.
 */
export function useFillPriced(query: {
  pages: readonly (readonly ItemResult[])[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isError: boolean;
  fetchNextPage: () => unknown;
}) {
  const { pages, hasNextPage, isFetchingNextPage, isError, fetchNextPage } =
    query;
  const hasPriced = pages.some((page) =>
    page.some((item) => item.hasPrice === true),
  );
  const shouldFetch =
    pages.length > 0 &&
    pages.length < MAX_AUTO_PAGES &&
    !hasPriced &&
    hasNextPage &&
    !isFetchingNextPage &&
    !isError;
  useEffect(() => {
    if (shouldFetch) void fetchNextPage();
  }, [shouldFetch, fetchNextPage]);
  return { isFilling: shouldFetch || (isFetchingNextPage && !hasPriced) };
}
