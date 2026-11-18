'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { favoriteQueries } from '@/features/favorites/queries';
import { historyQueries } from '@/features/history/queries';
import { reviewQueries } from '@/features/reviews/queries';

/** 마이 홈 메뉴 줄 오른쪽 개수. 하위 화면이 같은 캐시를 쓰므로 들어가면 바로 보인다. 실패한 개수는 숨긴다. */
export function useMyCounts(isSignedIn: boolean) {
  const favorites = useQuery({
    ...favoriteQueries.list(),
    enabled: isSignedIn,
    select: (list) => list.length,
  });
  const history = useQuery({
    ...historyQueries.list(),
    enabled: isSignedIn,
    select: (list) => list.length,
  });
  const reviews = useInfiniteQuery({
    ...reviewQueries.mine(),
    enabled: isSignedIn,
    select: (data) => data.pages[0]?.totalElements,
  });
  return {
    favorites: favorites.data,
    history: history.data,
    reviews: reviews.data,
  };
}
