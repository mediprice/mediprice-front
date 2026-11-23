import { describe, expect, it } from 'vitest';

import { relaxedKeyword } from './relaxed-keyword';

describe('relaxedKeyword', () => {
  it('띄어쓰기를 빼고 꼬리말 하나를 뗀다', () => {
    expect(relaxedKeyword('도수 치료')).toBe('도수치료');
    expect(relaxedKeyword('도수치료비')).toBe('도수치료');
    expect(relaxedKeyword('임플란트 가격')).toBe('임플란트');
    expect(relaxedKeyword('라식수술')).toBe('라식');
    expect(relaxedKeyword('대상포진 주사')).toBe('대상포진');
  });

  it('바뀌는 게 없거나 너무 짧아지면 null이다', () => {
    expect(relaxedKeyword('스케일링')).toBeNull();
    expect(relaxedKeyword('  도수  ')).toBeNull();
    expect(relaxedKeyword('주사')).toBeNull();
    expect(relaxedKeyword('수비')).toBeNull();
  });
});
