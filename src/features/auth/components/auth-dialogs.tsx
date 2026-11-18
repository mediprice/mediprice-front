'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { subscribeSessionExpired } from '@/lib/api/session-events';

import { markSignedOut, sessionKeys } from '../queries';
import { LoginDialog } from './login-dialog';
import { SessionExpiredDialog } from './session-expired-dialog';

/** 셸 레이아웃에 한 번만 둔다. 로그인 다이얼로그를 렌더하고, 로그인했던 사용자의 세션이 끝나면 다시 로그인을 안내한다. */
export function AuthDialogs() {
  const queryClient = useQueryClient();
  const [isExpiredOpen, setIsExpiredOpen] = useState(false);

  useEffect(
    () =>
      subscribeSessionExpired(() => {
        if (!queryClient.getQueryData(sessionKeys.current())) return;
        markSignedOut(queryClient);
        setIsExpiredOpen(true);
      }),
    [queryClient],
  );

  return (
    <>
      <LoginDialog />
      <SessionExpiredDialog
        open={isExpiredOpen}
        onOpenChange={setIsExpiredOpen}
      />
    </>
  );
}
