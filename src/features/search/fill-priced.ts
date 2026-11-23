import { type ItemResult, MAX_AUTO_PAGES } from './queries';

export type FillState = {
  pages: readonly (readonly ItemResult[])[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isError: boolean;
  /** mayFindMorePriced. 목록이 가격 있는 항목을 먼저 주면(#24) false라 이어 읽지 않는다. */
  canFindMore: boolean;
};

/** 받은 페이지에 그 지역 가격이 있는 항목이 하나도 없고 더 읽어서 찾을 수 있으면 다음 페이지를 저절로 읽는다(최대 MAX_AUTO_PAGES페이지). */
export function shouldFillPriced({
  pages,
  hasNextPage,
  isFetchingNextPage,
  isError,
  canFindMore,
}: FillState) {
  const hasPriced = pages.some((page) =>
    page.some((item) => item.hasPrice === true),
  );
  return (
    pages.length > 0 &&
    pages.length < MAX_AUTO_PAGES &&
    !hasPriced &&
    canFindMore &&
    hasNextPage &&
    !isFetchingNextPage &&
    !isError
  );
}
