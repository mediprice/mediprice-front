export type RotationState = {
  index: number;
  isHovered: boolean;
  hasFocus: boolean;
  isUserPaused: boolean;
};

export type RotationAction =
  | { type: 'next' | 'prev' | 'tick'; length: number }
  | { type: 'goTo'; index: number; length: number }
  | { type: 'hover' | 'focus'; value: boolean }
  | { type: 'toggle' }
  | { type: 'pause' };

export const initialRotation: RotationState = {
  index: 0,
  isHovered: false,
  hasFocus: false,
  isUserPaused: false,
};

function wrap(index: number, length: number) {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

/** 마우스·포커스·사용자 멈춤 중 하나라도 있으면 자동 넘김을 멈춘다. 탭 숨김·reduced-motion은 훅이 더한다. */
export function isRotationPaused(state: RotationState) {
  return state.isHovered || state.hasFocus || state.isUserPaused;
}

export function rotationReducer(
  state: RotationState,
  action: RotationAction,
): RotationState {
  switch (action.type) {
    case 'next':
      return { ...state, index: wrap(state.index + 1, action.length) };
    case 'prev':
      return { ...state, index: wrap(state.index - 1, action.length) };
    case 'tick':
      if (isRotationPaused(state)) return state;
      return { ...state, index: wrap(state.index + 1, action.length) };
    case 'goTo':
      return { ...state, index: wrap(action.index, action.length) };
    case 'hover':
      return { ...state, isHovered: action.value };
    case 'focus':
      return { ...state, hasFocus: action.value };
    case 'toggle':
      /** 재생을 누른 순간에는 마우스·포커스가 버튼 위에 있으므로 그 멈춤을 풀어야 바로 돈다. */
      return state.isUserPaused
        ? { ...state, isUserPaused: false, isHovered: false, hasFocus: false }
        : { ...state, isUserPaused: true };
    case 'pause':
      return { ...state, isUserPaused: true };
  }
}
