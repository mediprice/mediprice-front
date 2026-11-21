import { describe, expect, it } from 'vitest';

import {
  parseFromParam,
  parseReviewId,
  reviewClaimHref,
  reviewWriteHref,
} from './write-href';

describe('reviewWriteHref', () => {
  it('새 후기는 쿼리 없이, 수정은 후기 번호와 돌아갈 화면을 붙인다', () => {
    expect(reviewWriteHref('JDQ4MTYyMiM1MSMk')).toBe(
      '/hospitals/JDQ4MTYyMiM1MSMk/review',
    );
    expect(reviewWriteHref('H1', { edit: 7, from: 'my' })).toBe(
      '/hospitals/H1/review?edit=7&from=my',
    );
    expect(reviewWriteHref('H1', { edit: 7, from: 'hospital' })).toBe(
      '/hospitals/H1/review?edit=7',
    );
  });

  it('ykiho의 특수 문자는 경로에 맞게 인코딩한다', () => {
    expect(reviewWriteHref('a/b+c=')).toBe('/hospitals/a%2Fb%2Bc%3D/review');
  });
});

describe('parseReviewId', () => {
  it('양의 정수 문자열만 후기 번호로 본다', () => {
    expect(parseReviewId('12')).toBe(12);
    expect(parseReviewId('0')).toBeNull();
    expect(parseReviewId('-3')).toBeNull();
    expect(parseReviewId('1.5')).toBeNull();
    expect(parseReviewId('abc')).toBeNull();
    expect(parseReviewId(['1', '2'])).toBeNull();
    expect(parseReviewId(undefined)).toBeNull();
    expect(parseReviewId('99999999999999999')).toBeNull();
  });
});

describe('parseFromParam', () => {
  it('my가 아니면 병원 화면으로 돌아간다', () => {
    expect(parseFromParam('my')).toBe('my');
    expect(parseFromParam('evil')).toBe('hospital');
    expect(parseFromParam(undefined)).toBe('hospital');
  });
});

describe('reviewClaimHref', () => {
  it('병원 아래 후기 번호의 권리침해 신고 화면을 가리킨다', () => {
    expect(reviewClaimHref('a/b+c=', 11)).toBe(
      '/hospitals/a%2Fb%2Bc%3D/review/11/claim',
    );
  });
});
