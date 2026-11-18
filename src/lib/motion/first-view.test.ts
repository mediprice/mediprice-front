import { describe, expect, it } from 'vitest';

import { isRectInViewport, startPhase } from './first-view';

const base = {
  reducedMotion: false,
  canObserve: true,
  isInViewport: false,
  playIfVisible: false,
};

describe('startPhase', () => {
  it('화면 밖 요소는 시작 모습으로 기다린다', () => {
    expect(startPhase(base)).toBe('waiting');
  });

  it('reduced-motion이면 움직이지 않는다', () => {
    expect(startPhase({ ...base, reducedMotion: true })).toBe('static');
    expect(
      startPhase({ ...base, reducedMotion: true, playIfVisible: true }),
    ).toBe('static');
  });

  it('IntersectionObserver가 없으면 최종 모습으로 둔다', () => {
    expect(startPhase({ ...base, canObserve: false })).toBe('static');
  });

  it('이미 보이는 요소는 깜빡이지 않게 그대로 두고, playIfVisible이면 재생한다', () => {
    expect(startPhase({ ...base, isInViewport: true })).toBe('static');
    expect(
      startPhase({ ...base, isInViewport: true, playIfVisible: true }),
    ).toBe('waiting');
  });
});

describe('isRectInViewport', () => {
  it('화면 높이와 겹치면 보이는 것으로 본다', () => {
    expect(isRectInViewport({ top: 100, bottom: 200 }, 800)).toBe(true);
    expect(isRectInViewport({ top: -50, bottom: 10 }, 800)).toBe(true);
  });

  it('화면 위나 아래로 완전히 벗어나면 보이지 않는다', () => {
    expect(isRectInViewport({ top: 800, bottom: 900 }, 800)).toBe(false);
    expect(isRectInViewport({ top: -100, bottom: 0 }, 800)).toBe(false);
  });
});
