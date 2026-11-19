import { describe, expect, it } from 'vitest';

import { formatItemTitle } from './item-title';

describe('formatItemTitle', () => {
  it('대분류 경로를 빼고 나머지를 가운뎃점으로 잇는다', () => {
    expect(
      formatItemTitle({
        name: '이학요법료/도수치료',
        mdivName: '이학요법료',
      }),
    ).toBe('도수치료');
    expect(
      formatItemTitle({
        name: '치과의 보철료/치과임플란트(1치당)/PFM',
        mdivName: '치과의 보철료',
      }),
    ).toBe('치과임플란트(1치당) · PFM');
  });

  it('대분류와 이름이 같으면 이름을 그대로 쓴다', () => {
    expect(
      formatItemTitle({
        name: '자기공명영상진단료(MRI-기본검사)',
        mdivName: '자기공명영상진단료(MRI-기본검사)',
      }),
    ).toBe('자기공명영상진단료(MRI-기본검사)');
  });
});
