const listeners = new Set<() => void>();

/**
 * 세션이 끝났을 때(Refresh까지 거부됨) 알림을 받는다. API 클라이언트는 화면을 모르므로, 로그인 화면으로
 * 보내거나 쿼리 캐시를 비우는 일은 구독한 쪽이 한다.
 */
export function subscribeSessionExpired(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitSessionExpired() {
  for (const listener of listeners) listener();
}
