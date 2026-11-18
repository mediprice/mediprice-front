'use client';

import { useQuery } from '@tanstack/react-query';

import { npayQueries } from '@/features/npay/queries';
import { ApiError } from '@/lib/api/errors';

export function isItemNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

/** 항목을 확인한 뒤에 가격을 부른다. 없는 코드면 요청 하나로 끝나고, 다른 실패면 가격 조각이 각자 오류를 보여 준다. */
export function useItemReady(code: string) {
  const { isSuccess, isError, error } = useQuery(npayQueries.detail(code));
  return isSuccess || (isError && !isItemNotFound(error));
}
