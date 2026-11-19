import { describe, expect, it } from 'vitest';

import { sanitizeReturnPath } from './return-path';

describe('sanitizeReturnPath', () => {
  it.each([
    ['/', '/'],
    ['/my', '/my'],
    ['/items/ABC?region=seoul', '/items/ABC?region=seoul'],
    ['/hospitals/X#reviews', '/hospitals/X'],
  ])('같은 출처의 상대 경로 %s는 %s로 받는다', (value, expected) => {
    expect(sanitizeReturnPath(value)).toBe(expected);
  });

  it.each([
    ['절대 주소', 'https://evil.example/path'],
    ['프로토콜 상대 주소', '//evil.example/path'],
    ['역슬래시 우회', '/\\evil.example'],
    ['역슬래시만', '\\\\evil.example'],
    ['javascript 스킴', 'javascript:alert(1)'],
    ['상대 경로', 'my/account'],
    ['제어 문자', '/\tevil'],
    ['콜백 주소', '/oauth/callback'],
    ['빈 값', ''],
    ['512자 초과', `/${'a'.repeat(512)}`],
  ])('%s(%s)는 거부한다', (_name, value) => {
    expect(sanitizeReturnPath(value)).toBeNull();
  });

  it('문자열이 아니면 거부한다', () => {
    expect(sanitizeReturnPath(null)).toBeNull();
    expect(sanitizeReturnPath(42)).toBeNull();
  });
});
