/**
 * 처음 보일 때 한 번 재생하는 움직임의 단계.
 * - static: 움직이지 않고 최종 모습(서버 렌더·JS 없음·reduced-motion)
 * - waiting: 화면 밖에서 시작 모습으로 기다림
 * - playing: 화면에 들어와 최종 모습으로 움직이는 중(이후 계속 유지)
 */
export type FirstViewPhase = 'static' | 'waiting' | 'playing';

/** 마운트 직후 시작 단계를 고른다. 이미 화면에 보이는 요소를 숨겼다 다시 보이면 깜빡이므로 playIfVisible이 아니면 static으로 둔다. */
export function startPhase({
  reducedMotion,
  canObserve,
  isInViewport,
  playIfVisible,
}: {
  reducedMotion: boolean;
  canObserve: boolean;
  isInViewport: boolean;
  playIfVisible: boolean;
}): FirstViewPhase {
  if (reducedMotion || !canObserve) return 'static';
  if (isInViewport && !playIfVisible) return 'static';
  return 'waiting';
}

export function isRectInViewport(
  rect: { top: number; bottom: number },
  viewportHeight: number,
) {
  return rect.bottom > 0 && rect.top < viewportHeight;
}
