'use client';

import {
  type QueryKey,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { useSession } from '@/features/auth/use-session';

/**
 * 백엔드는 로그인한 사용자가 상세를 읽을 때 최근 본 기록을 남긴다. 서버가 익명으로 채운 상세는 기록되지 않으므로,
 * 로그인했으면 같은 상세를 BFF로 한 번 더 읽는다. 따로 둔 키라 실패해도 화면의 상세는 그대로다.
 */
export function useRecordView<TData, TKey extends QueryKey>(
  { queryKey, queryFn }: UseQueryOptions<TData, Error, TData, TKey>,
  isActive = true,
) {
  const { status } = useSession();
  useQuery({
    /** 상세 queryFn은 키를 읽지 않고 클로저의 코드로 부르므로, 꼬리를 붙인 키를 같은 키 타입으로 넘겨도 된다. */
    queryKey: [...queryKey, 'recordView'] as unknown as TKey,
    queryFn,
    enabled: isActive && status === 'authenticated',
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    notifyOnChangeProps: [],
  });
}
