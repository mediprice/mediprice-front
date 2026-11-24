import { describe, expect, it } from 'vitest';

import { formatItemPath, lastSegment } from './item-name';

describe('formatItemPath', () => {
  it.each([
    ['이학요법료/도수치료', '이학요법료', '도수치료'],
    ['이학요법료/도수치료/도수치료', '이학요법료', '도수치료 · 도수치료'],
    [
      '치과의 보철료/치과임플란트(1치당)/PFM',
      '치과의 보철료',
      '치과임플란트(1치당) · PFM',
    ],
    [
      '제증명수수료/상해진단서/3주 미만',
      '제증명수수료',
      '상해진단서 · 3주 미만',
    ],
  ])(
    '%s에서 대분류 %s를 떼고 단계를 가운뎃점으로 잇는다',
    (name, major, expected) => {
      expect(formatItemPath(name, major)).toBe(expected);
    },
  );

  it('대분류와 이름이 같으면 이름을 그대로 쓴다', () => {
    expect(
      formatItemPath(
        '자기공명영상진단료(MRI-기본검사)',
        '자기공명영상진단료(MRI-기본검사)',
      ),
    ).toBe('자기공명영상진단료(MRI-기본검사)');
  });

  it('대분류가 없거나 앞에 없으면 경로 전체를 잇는다', () => {
    expect(formatItemPath('도수치료', null)).toBe('도수치료');
    expect(formatItemPath('이학요법료/도수치료', '주사료')).toBe(
      '이학요법료 · 도수치료',
    );
  });

  it('조각의 앞뒤 공백과 빈 조각은 뺀다', () => {
    expect(formatItemPath('이학요법료 / 도수치료/ ', '이학요법료')).toBe(
      '도수치료',
    );
  });
});

describe('lastSegment', () => {
  it('분류 경로의 마지막 조각만 남긴다', () => {
    expect(lastSegment('예방접종료/대상포진/스카이조스터주')).toBe(
      '스카이조스터주',
    );
    expect(lastSegment('도수치료')).toBe('도수치료');
    expect(lastSegment('이학요법료/도수치료/ ')).toBe('도수치료');
  });
});
