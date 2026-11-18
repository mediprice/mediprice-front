'use client';

import { useMutation } from '@tanstack/react-query';
import { useState, useSyncExternalStore } from 'react';

import { liveFeeApi } from './api';
import {
  cooldownKey,
  readCooldownUntil,
  secondsUntil,
  startCooldown,
} from './cooldown';

/** 사파리 비공개 창 등에서는 sessionStorage에 접근만 해도 예외가 난다. */
function sessionStorageOrNull() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function subscribeSecondTick(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}

/** 사용자가 누를 때만 누리집을 조회하고, 같은 병원·항목은 새로고침해도 쿨다운 동안 다시 부르지 않는다. */
export function useLiveFeeCheck(ykiho: string, npayCode: string) {
  const key = cooldownKey(ykiho, npayCode);
  const [localUntil, setLocalUntil] = useState(0);
  const secondsLeft = useSyncExternalStore(
    subscribeSecondTick,
    () => {
      const now = Date.now();
      const until = Math.max(
        localUntil,
        readCooldownUntil(sessionStorageOrNull(), key, now),
      );
      return secondsUntil(until, now);
    },
    () => 0,
  );
  const mutation = useMutation({
    mutationFn: () => liveFeeApi.fetchLiveFee(ykiho, npayCode),
  });

  function check() {
    if (mutation.isPending || secondsLeft > 0) return;
    setLocalUntil(startCooldown(sessionStorageOrNull(), key, Date.now()));
    mutation.mutate();
  }

  return {
    check,
    isChecking: mutation.isPending,
    result: mutation.data,
    error: mutation.error,
    secondsLeft,
  };
}
