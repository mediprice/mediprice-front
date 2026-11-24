'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useSyncExternalStore } from 'react';

import { type LoginReason, openLoginDialog } from './login-dialog-store';
import { type CurrentUser, sessionQueries } from './queries';

export type SessionStatus = 'pending' | 'authenticated' | 'anonymous' | 'error';

export type Session = {
  status: SessionStatus;
  user: CurrentUser | null;
  refetch: () => void;
};

const noSubscribe = () => () => {};

/**
 * 쿼리 결과를 화면이 분기하기 쉬운 상태 하나로 바꾼다. 서버 렌더와 hydration 중에는 항상 pending이다.
 * 화면 일부의 hydration이 늦어지는 동안 다른 곳에서 세션 확인이 끝나도 서버 HTML과 어긋나지 않게 한다.
 */
export function useSession(): Session {
  const { data, isPending, isError, refetch } = useQuery(
    sessionQueries.current(),
  );
  const isHydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const status: SessionStatus =
    !isHydrated || isPending
      ? 'pending'
      : data
        ? 'authenticated'
        : isError
          ? 'error'
          : 'anonymous';
  return {
    status,
    user: isHydrated ? (data ?? null) : null,
    refetch: () => void refetch(),
  };
}

/** 로그인이 필요한 행동을 감싼다. 로그인했으면 실행하고, 아니면 로그인 다이얼로그를 연다(확인 중에는 무시). */
export function useLoginGuard() {
  const { status } = useSession();
  return useCallback(
    <A extends unknown[]>(reason: LoginReason, action: (...args: A) => void) =>
      (...args: A) => {
        if (status === 'authenticated') action(...args);
        else if (status !== 'pending') openLoginDialog({ reason });
      },
    [status],
  );
}

/** 화면에 보일 이름. 백엔드 이름이 비었으면 이메일 앞부분을 쓴다. */
export function displayName(user: CurrentUser) {
  return user.name?.trim() || user.email.split('@')[0] || user.email;
}
