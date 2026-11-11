import { describe, expect, it } from 'vitest';

import { serializeQuery } from './query';

describe('serializeQuery', () => {
  it('조건 객체를 풀어 평평한 쿼리 문자열로 만든다', () => {
    expect(
      serializeQuery({
        condition: { keyword: '삼성', sidoCode: '110000' },
        pageQuery: { page: 0, size: 5 },
      }),
    ).toBe('keyword=%EC%82%BC%EC%84%B1&sidoCode=110000&page=0&size=5');
  });

  it('최상위 값도 그대로 보낸다', () => {
    expect(serializeQuery({ npayCode: 'MX1220000', radius: 1000 })).toBe(
      'npayCode=MX1220000&radius=1000',
    );
  });

  it('값이 없는 항목은 보내지 않는다', () => {
    expect(
      serializeQuery({
        condition: { keyword: 'a', sidoCode: undefined, sgguCode: null },
      }),
    ).toBe('keyword=a');
  });

  it('배열은 쉼표로 이어 붙인다(백엔드의 "?ykihos=A,B" 형식)', () => {
    expect(
      serializeQuery({ condition: { ykihos: ['A', 'B'], npayCodes: ['X'] } }),
    ).toBe('ykihos=A%2CB&npayCodes=X');
  });

  it('불리언도 문자열로 바꾼다', () => {
    expect(serializeQuery({ flag: false })).toBe('flag=false');
  });

  it('비어 있으면 빈 문자열이다', () => {
    expect(serializeQuery({})).toBe('');
    expect(serializeQuery({ condition: {} })).toBe('');
  });
});
