import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { components } from '@/lib/api/schema';
import { unwrap } from '@/lib/api/unwrap';

export type ViewHistory = components['schemas']['ViewHistoryResponse'];
export type ViewTargetType = ViewHistory['type'];

/** 백엔드가 사용자마다 최근 100개만 남기므로 한 번에 모두 받아 종류별로 나눈다. */
const MAX_HISTORIES = 100;

export const historyKeys = {
  all: ['history'] as const,
  list: () => [...historyKeys.all, 'list'] as const,
  remove: () => [...historyKeys.all, 'remove'] as const,
};

export const historyQueries = {
  list: () =>
    queryOptions({
      queryKey: historyKeys.list(),
      queryFn: async () => {
        const response = await unwrap(
          apiClient.GET('/api/users/me/histories', {
            params: {
              query: { pageQuery: { page: 0, size: MAX_HISTORIES } },
            },
          }),
        );
        return response.content;
      },
      /** 병원·항목을 볼 때마다 서버에서 쌓이므로 화면에 올 때마다 새로 받는다. */
      staleTime: 0,
    }),
};

/** 이미 지워진 기록(다른 기기에서 삭제)은 목표가 이뤄진 것이라 성공으로 본다. */
async function removeHistory(id: number) {
  try {
    await unwrap(
      apiClient.DELETE('/api/users/me/histories/{historyId}', {
        params: { path: { historyId: id } },
      }),
    );
  } catch (error) {
    if (error instanceof ApiError && error.code === 'HISTORY_NOT_FOUND') return;
    throw error;
  }
}

export const historyMutations = {
  /** 목록에서 먼저 빼고, 실패하면 되돌린다. */
  remove: () =>
    mutationOptions({
      mutationKey: historyKeys.remove(),
      mutationFn: (id: number) => removeHistory(id),
      onMutate: async (id, { client }) => {
        await client.cancelQueries({ queryKey: historyKeys.list() });
        const previous = client.getQueryData<ViewHistory[]>(historyKeys.list());
        if (previous) {
          client.setQueryData(
            historyKeys.list(),
            previous.filter((entry) => entry.id !== id),
          );
        }
        return { previous };
      },
      onError: (_error, _id, result, { client }) => {
        if (result?.previous) {
          client.setQueryData(historyKeys.list(), result.previous);
        }
      },
      /** 연달아 지우는 중이면 마지막 삭제가 끝난 뒤에만 다시 불러와 지운 줄이 잠깐 되살아나지 않게 한다. */
      onSettled: async (_data, _error, _id, _result, { client }) => {
        if (client.isMutating({ mutationKey: historyKeys.remove() }) > 1) {
          return;
        }
        await client.invalidateQueries({ queryKey: historyKeys.list() });
      },
    }),
  /** 확인 다이얼로그에서 결과를 기다리므로 낙관적으로 바꾸지 않는다. */
  clear: () =>
    mutationOptions({
      mutationFn: () => unwrap(apiClient.DELETE('/api/users/me/histories')),
      onSuccess: (_data, _variables, _result, { client }) => {
        client.setQueryData(historyKeys.list(), []);
      },
    }),
};
