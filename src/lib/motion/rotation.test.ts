import { describe, expect, it } from 'vitest';

import {
  initialRotation,
  isRotationPaused,
  rotationReducer,
  type RotationState,
} from './rotation';

const at = (index: number, patch: Partial<RotationState> = {}) => ({
  ...initialRotation,
  index,
  ...patch,
});

describe('rotationReducer', () => {
  it('다음은 끝에서 처음으로, 이전은 처음에서 끝으로 돈다', () => {
    expect(rotationReducer(at(2), { type: 'next', length: 3 }).index).toBe(0);
    expect(rotationReducer(at(0), { type: 'prev', length: 3 }).index).toBe(2);
  });

  it('자동 넘김(tick)은 멈춘 동안 순서를 바꾸지 않는다', () => {
    for (const patch of [
      { isHovered: true },
      { hasFocus: true },
      { isUserPaused: true },
    ]) {
      const state = at(1, patch);
      expect(rotationReducer(state, { type: 'tick', length: 3 })).toBe(state);
    }
    expect(rotationReducer(at(1), { type: 'tick', length: 3 }).index).toBe(2);
  });

  it('멈춘 동안에도 사용자가 누른 다음·이전은 동작한다', () => {
    const paused = at(0, { isUserPaused: true });
    expect(rotationReducer(paused, { type: 'next', length: 3 }).index).toBe(1);
  });

  it('항목이 없으면 0에 머문다', () => {
    expect(rotationReducer(at(0), { type: 'next', length: 0 }).index).toBe(0);
    expect(rotationReducer(at(0), { type: 'prev', length: 0 }).index).toBe(0);
  });

  it('goTo는 범위 밖 번호를 감싼다', () => {
    expect(
      rotationReducer(at(0), { type: 'goTo', index: 4, length: 3 }).index,
    ).toBe(1);
  });

  it('멈춤 버튼은 사용자 멈춤을 켜고 끈다', () => {
    const paused = rotationReducer(at(0), { type: 'toggle' });
    expect(isRotationPaused(paused)).toBe(true);
    expect(isRotationPaused(rotationReducer(paused, { type: 'toggle' }))).toBe(
      false,
    );
  });

  it('재생을 누르면 버튼 위의 마우스·포커스가 있어도 바로 돈다', () => {
    const state = at(0, {
      isUserPaused: true,
      isHovered: true,
      hasFocus: true,
    });
    expect(isRotationPaused(rotationReducer(state, { type: 'toggle' }))).toBe(
      false,
    );
  });

  it('마우스나 포커스가 빠지면 다시 돈다', () => {
    const hovered = rotationReducer(at(0), { type: 'hover', value: true });
    expect(isRotationPaused(hovered)).toBe(true);
    expect(
      isRotationPaused(
        rotationReducer(hovered, { type: 'hover', value: false }),
      ),
    ).toBe(false);
  });
});
