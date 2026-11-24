import { describe, expect, it } from 'vitest';

import {
  buildCompareHref,
  MAX_COMPARE,
  parseCompareParams,
  parseDropped,
  parseItemCode,
  parseYkihos,
} from './compare-params';

const A = 'JDQ4MTg4MSM1MSMkMSMkMCMk';
const B = 'JDQ4MTg4MSM1MSMkMSMkMCMl';
const C = 'JDQ4MTg4MSM1MSMkMSMkMCMm';
const D = 'JDQ4MTg4MSM1MSMkMSMkMCMn';

describe('parseYkihos', () => {
  it('값 하나도 배열로 돌려준다', () => {
    expect(parseYkihos(A)).toEqual([A]);
  });

  it('없으면 빈 배열이다', () => {
    expect(parseYkihos(undefined)).toEqual([]);
  });

  it('형식이 틀린 값과 중복을 버린다', () => {
    expect(parseYkihos([A, '<script>', A, '', B])).toEqual([A, B]);
  });

  it(`앞에서부터 ${MAX_COMPARE}곳만 남긴다`, () => {
    expect(parseYkihos([A, B, C, D])).toEqual([A, B, C]);
  });

  it('base64 문자(+ / =)는 받는다', () => {
    expect(parseYkihos('ab+c/d==')).toEqual(['ab+c/d==']);
  });
});

describe('parseItemCode', () => {
  it('영문·숫자 코드만 받는다', () => {
    expect(parseItemCode('MX1220000')).toBe('MX1220000');
    expect(parseItemCode('MX12-0000')).toBeNull();
    expect(parseItemCode(['MX1220000'])).toBeNull();
    expect(parseItemCode(undefined)).toBeNull();
  });
});

describe('parseDropped', () => {
  it('1~3 정수만 받고 나머지는 0이다', () => {
    expect(parseDropped('1')).toBe(1);
    expect(parseDropped(['2', '3'])).toBe(2);
    expect(parseDropped('4')).toBe(0);
    expect(parseDropped('1.5')).toBe(0);
    expect(parseDropped(undefined)).toBe(0);
  });

  it('buildCompareHref는 뺀 수가 있을 때만 붙인다', () => {
    expect(buildCompareHref(['A1'], null, 1)).toBe('/compare?h=A1&dropped=1');
    expect(buildCompareHref(['A1'], null)).toBe('/compare?h=A1');
  });
});

describe('parseCompareParams', () => {
  it('h와 item을 함께 읽는다', () => {
    expect(parseCompareParams({ h: [A, B], item: 'MX1220000' })).toEqual({
      ykihos: [A, B],
      item: 'MX1220000',
      dropped: 0,
    });
  });
});

describe('buildCompareHref', () => {
  it('병원마다 h를 붙이고 항목은 item으로 붙인다', () => {
    const href = buildCompareHref([A, B], 'MX1220000');
    const url = new URL(href, 'http://app.test');
    expect(url.pathname).toBe('/compare');
    expect(url.searchParams.getAll('h')).toEqual([A, B]);
    expect(url.searchParams.get('item')).toBe('MX1220000');
  });

  it('+ / = 가 섞인 값도 되읽으면 같다', () => {
    const href = buildCompareHref(['ab+c/d=='], null);
    const url = new URL(href, 'http://app.test');
    expect(parseCompareParams({ h: url.searchParams.getAll('h') })).toEqual({
      ykihos: ['ab+c/d=='],
      item: null,
      dropped: 0,
    });
  });

  it('비어 있으면 쿼리 없이 /compare다', () => {
    expect(buildCompareHref([], null)).toBe('/compare');
  });
});
