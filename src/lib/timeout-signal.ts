/** `parent`가 끊기거나 `ms`가 지나면 끊기는 신호. AbortSignal.any·timeout은 Safari 15 이하에 없어 AbortController와 타이머로 만든다. 끝나면 `clear`로 타이머와 리스너를 지운다. */
export function timeoutSignal(ms: number, parent?: AbortSignal) {
  const controller = new AbortController();
  const abortWithParent = () => controller.abort(parent?.reason);
  const timer = setTimeout(
    () => controller.abort(new Error(`Timed out after ${ms}ms`)),
    ms,
  );
  if (parent?.aborted) abortWithParent();
  else parent?.addEventListener('abort', abortWithParent, { once: true });

  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timer);
      parent?.removeEventListener('abort', abortWithParent);
    },
  };
}
