import 'server-only';

import { notFound } from 'next/navigation';
import { cache } from 'react';

import { ApiError } from '@/lib/api/errors';
import { getQueryClient } from '@/lib/query-client';

/** generateMetadata와 페이지가 같은 요청에서 한 번만 읽도록 요청마다 QueryClient 하나를 함께 쓴다. 서버는 다시 시도하지 않는다. */
export const getRequestQueryClient = cache(() => {
  const queryClient = getQueryClient();
  const defaults = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({
    ...defaults,
    queries: { ...defaults.queries, retry: false },
  });
  return queryClient;
});

export function isMissing(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

/** 백엔드가 없다고 답하면 404 페이지로 보낸다. 그 밖의 실패는 null이라 브라우저가 다시 읽고 오류 화면을 보여 준다. */
export async function loadOrNotFound<T>(load: () => Promise<T>) {
  try {
    return await load();
  } catch (error) {
    if (isMissing(error)) notFound();
    return null;
  }
}
