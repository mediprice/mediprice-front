import { describe, expect, it } from 'vitest';

import { formatLocation } from './format-location';

describe('formatLocation', () => {
  it.each([
    ['부산', '부산남구', '부산 남구'],
    ['대구', '대구동구', '대구 동구'],
    ['서울', '강남구', '서울 강남구'],
    ['경기', '부천원미구', '경기 부천시 원미구'],
    ['경기', '화성효행구', '경기 화성시 효행구'],
    ['경기', '고양일산동구', '경기 고양시 일산동구'],
    ['경기', '수원시', '경기 수원시'],
    ['경남', '김해시', '경남 김해시'],
  ])('%s %s를 "%s"로 바꾼다', (sido, sggu, expected) => {
    expect(formatLocation(sido, sggu)).toBe(expected);
  });

  it('값이 없으면 있는 것만 쓴다', () => {
    expect(formatLocation('서울', null)).toBe('서울');
    expect(formatLocation(null, null)).toBe('');
  });
});
