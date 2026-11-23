import {
  mutationOptions,
  type QueryClient,
  queryOptions,
} from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { BFF_BASE } from '@/lib/api/paths';
import type { components } from '@/lib/api/schema';
import { unwrap } from '@/lib/api/unwrap';

import { consentApi } from './consent-api';
import { myDataApi } from './my-data-export';
import { requiredConsentDecisions } from './required-consent';

export type CurrentUser = components['schemas']['UserResponse'];

const sessionSchema = z.object({ authenticated: z.boolean() });

export type SessionState = 'authenticated' | 'anonymous' | 'unavailable';

/** 쿠키만 보고 답하는 BFF 세션 확인. 401 재발급 흐름을 타지 않아 로그인하지 않은 방문에서 세션 만료 이벤트가 나지 않는다. */
export async function getSession(baseUrl = BFF_BASE): Promise<SessionState> {
  try {
    const response = await fetch(`${baseUrl}/session`, {
      credentials: 'same-origin',
    });
    if (!response.ok) return 'unavailable';
    const parsed = sessionSchema.safeParse(await response.json());
    if (!parsed.success) return 'unavailable';
    return parsed.data.authenticated ? 'authenticated' : 'anonymous';
  } catch {
    return 'unavailable';
  }
}

/** 로그인하지 않았거나 토큰이 거부되면(401) 에러가 아니라 `null`이다. */
export async function fetchCurrentUser(
  baseUrl = BFF_BASE,
): Promise<CurrentUser | null> {
  const session = await getSession(baseUrl);
  if (session === 'anonymous') return null;
  if (session === 'unavailable') {
    throw new ApiError(503, 'UPSTREAM_UNAVAILABLE', 'Session unavailable');
  }
  try {
    return await unwrap(apiClient.GET('/api/users/me'));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export const sessionKeys = {
  all: ['session'] as const,
  current: () => [...sessionKeys.all, 'current'] as const,
};

export const sessionQueries = {
  current: () =>
    queryOptions({
      queryKey: sessionKeys.current(),
      queryFn: () => fetchCurrentUser(),
      staleTime: 5 * 60 * 1000,
    }),
};

/** 이전 사용자의 데이터를 지우고 세션을 "로그인 안 함"으로 바꾼다. clear()와 달리 화면의 세션 구독자에게 변경이 전달된다. */
export function markSignedOut(queryClient: QueryClient) {
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== sessionKeys.all[0],
  });
  queryClient.setQueryData(sessionKeys.current(), null);
}

export function updateMyName(name: string) {
  return unwrap(apiClient.PATCH('/api/users/me', { body: { name } }));
}

export function withdrawAccount() {
  return unwrap(apiClient.DELETE('/api/users/me'));
}

/** 개인정보 열람 요구에 맞춰 서비스가 저장한 내 정보를 모두 받는다. */
export function exportMyData() {
  return myDataApi.fetchExport();
}

export const consentKeys = {
  all: ['consents'] as const,
  status: () => [...consentKeys.all, 'status'] as const,
};

export const consentQueries = {
  status: () =>
    queryOptions({
      queryKey: consentKeys.status(),
      queryFn: () => consentApi.fetchStatus(),
    }),
};

export const consentMutations = {
  /** 저장한 동의 상태를 바로 쓰고, 내 정보(필수 동의 누락 여부)를 다시 받아 동의 화면을 벗어난다. */
  saveRequired: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: () => consentApi.save(requiredConsentDecisions()),
      onSuccess: async (saved) => {
        queryClient.setQueryData(consentKeys.status(), saved);
        await queryClient.invalidateQueries({
          queryKey: sessionKeys.current(),
        });
      },
    }),
};
