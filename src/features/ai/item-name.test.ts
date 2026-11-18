import { describe, expect, it } from 'vitest';

import { formatItemName } from './item-name';

describe('formatItemName', () => {
  it('대분류 경로를 떼고 나머지 경로를 가운뎃점으로 잇는다', () => {
    expect(
      formatItemName({
        name: '이학요법료/도수치료/도수치료',
        mdivName: '이학요법료',
      }),
    ).toBe('도수치료 · 도수치료');
    expect(formatItemName({ name: '도수치료', mdivName: null })).toBe(
      '도수치료',
    );
  });
});
