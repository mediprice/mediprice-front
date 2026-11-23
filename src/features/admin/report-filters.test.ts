import { describe, expect, it } from 'vitest';

import {
  buildReportFiltersQuery,
  parseReportFilters,
  toReportsRequest,
} from './report-filters';

describe('parseReportFilters', () => {
  it('값이 없으면 대기 중 신고의 첫 페이지다', () => {
    expect(parseReportFilters({})).toEqual({ status: 'pending', page: 1 });
  });

  it('상태와 페이지를 읽는다', () => {
    expect(parseReportFilters({ status: 'resolved', page: '3' })).toEqual({
      status: 'resolved',
      page: 3,
    });
    expect(parseReportFilters({ status: 'all' }).status).toBe('all');
  });

  it('모르는 상태와 잘못된 페이지는 기본값으로 바꾼다', () => {
    expect(parseReportFilters({ status: 'PENDING', page: 'abc' })).toEqual({
      status: 'pending',
      page: 1,
    });
    expect(parseReportFilters({ page: '0' }).page).toBe(1);
    expect(parseReportFilters({ page: '-2' }).page).toBe(1);
    expect(parseReportFilters({ page: '1.5' }).page).toBe(1);
    expect(parseReportFilters({ page: '99999999' }).page).toBe(1);
  });

  it('같은 이름이 여러 번 오면 첫 값을 쓴다', () => {
    expect(
      parseReportFilters({ status: ['resolved', 'all'], page: ['2', '5'] }),
    ).toEqual({ status: 'resolved', page: 2 });
  });
});

describe('buildReportFiltersQuery', () => {
  it('기본값은 링크에서 뺀다', () => {
    expect(buildReportFiltersQuery({ status: 'pending', page: 1 })).toBe('');
  });

  it('기본이 아닌 값만 넣고, 읽으면 같은 필터가 된다', () => {
    const filters = { status: 'all', page: 4 } as const;
    const query = buildReportFiltersQuery(filters);
    expect(query).toBe('status=all&page=4');
    expect(
      parseReportFilters(Object.fromEntries(new URLSearchParams(query))),
    ).toEqual(filters);
  });
});

describe('toReportsRequest', () => {
  it('상태를 백엔드 값으로 바꾸고 페이지를 0부터 센다', () => {
    expect(toReportsRequest({ status: 'pending', page: 1 }, 20)).toEqual({
      condition: { status: 'PENDING' },
      pageQuery: { page: 0, size: 20 },
    });
    expect(toReportsRequest({ status: 'resolved', page: 3 }, 20)).toEqual({
      condition: { status: 'RESOLVED' },
      pageQuery: { page: 2, size: 20 },
    });
  });

  it('전체는 상태 조건을 보내지 않는다', () => {
    expect(toReportsRequest({ status: 'all', page: 1 }, 20).condition).toEqual(
      {},
    );
  });
});
