import { describe, expect, it } from 'vitest';

import {
  buildClaimFiltersQuery,
  parseClaimFilters,
  toClaimsRequest,
} from './claim-filters';

describe('parseClaimFilters', () => {
  it('기본은 대기 중 첫 페이지다', () => {
    expect(parseClaimFilters({})).toEqual({ status: 'pending', page: 1 });
  });

  it('잘못된 값은 기본값으로, 배열은 첫 값으로 읽는다', () => {
    expect(parseClaimFilters({ status: 'all', page: '0' })).toEqual({
      status: 'pending',
      page: 1,
    });
    expect(
      parseClaimFilters({ status: ['expired', 'resolved'], page: ['2'] }),
    ).toEqual({
      status: 'expired',
      page: 2,
    });
  });
});

describe('buildClaimFiltersQuery', () => {
  it('기본값은 링크에서 뺀다', () => {
    expect(buildClaimFiltersQuery({ status: 'pending', page: 1 })).toBe('');
    expect(buildClaimFiltersQuery({ status: 'resolved', page: 3 })).toBe(
      'status=resolved&page=3',
    );
  });
});

describe('toClaimsRequest', () => {
  it('백엔드 상태 이름과 0부터 세는 페이지로 바꾼다', () => {
    expect(toClaimsRequest({ status: 'expired', page: 1 }, 20)).toEqual({
      status: 'EXPIRED_PENDING',
      page: 0,
      size: 20,
    });
  });
});
