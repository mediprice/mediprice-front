import { describe, expect, it } from 'vitest';

import { cacheControlFor } from './cache-policy';

const PUBLIC = 'public, s-maxage=300, stale-while-revalidate=3600';
const anonymousGet = { method: 'GET', hasSession: false, status: 200 };

describe('cacheControlFor', () => {
  it.each([
    '/api/regions/sido',
    '/api/regions/sido/110000/sggu',
    '/api/institution-types',
    '/api/npay-items',
    '/api/npay-items/categories',
    '/api/npay-items/MX1220000/prices',
    '/api/npay-items/MX1220000/price-summary',
    '/api/hospitals/H1/prices',
    '/api/hospitals/H1/prices/history',
  ])('로그인하지 않은 공개 조회(%s)는 CDN에 둔다', (backendPath) => {
    expect(cacheControlFor({ ...anonymousGet, backendPath })).toBe(PUBLIC);
  });

  it.each([
    ['병원 상세(로그인 시 최근 기록)', '/api/hospitals/H1'],
    ['항목 상세(로그인 시 최근 기록)', '/api/npay-items/MX1220000'],
    ['병원 검색(검색어 기록)', '/api/hospitals'],
    ['후기(mine 표시)', '/api/hospitals/H1/reviews'],
    ['내 정보', '/api/users/me'],
    ['내 관심', '/api/users/me/favorites'],
    ['AI', '/api/ai/live-fee'],
  ])('%s는 no-store다', (_name, backendPath) => {
    expect(cacheControlFor({ ...anonymousGet, backendPath })).toBe('no-store');
  });

  it('로그인한 요청은 공개 조회라도 no-store다', () => {
    expect(
      cacheControlFor({
        ...anonymousGet,
        hasSession: true,
        backendPath: '/api/regions/sido',
      }),
    ).toBe('no-store');
  });

  it.each([404, 500, 304])('성공이 아닌 응답(%i)은 no-store다', (status) => {
    expect(
      cacheControlFor({
        ...anonymousGet,
        status,
        backendPath: '/api/regions/sido',
      }),
    ).toBe('no-store');
  });

  it('GET이 아닌 요청은 no-store다', () => {
    expect(
      cacheControlFor({
        ...anonymousGet,
        method: 'HEAD',
        backendPath: '/api/regions/sido',
      }),
    ).toBe('no-store');
  });
});
