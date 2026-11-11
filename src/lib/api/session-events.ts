const listeners = new Set<() => void>();

/** 세션이 끝났을 때(Refresh까지 거부됨) 알림을 받는다. 화면 이동·캐시 정리는 구독한 쪽이 한다. @public */
export function subscribeSessionExpired(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitSessionExpired() {
  for (const listener of listeners) listener();
}
