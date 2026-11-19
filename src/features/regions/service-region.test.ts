import { describe, expect, it } from 'vitest';

import { parseServiceRegion, regionQuery, sidoCodesOf } from './service-region';

describe('서비스 지역', () => {
  it('값이 없거나 잘못되면 서울·경기로 본다', () => {
    expect(parseServiceRegion(undefined)).toBe('metro');
    expect(parseServiceRegion('busan')).toBe('metro');
    expect(parseServiceRegion(['seoul', 'all'])).toBe('seoul');
  });

  it('서울·경기는 두 시도로, 전국은 조건 없이 조회한다', () => {
    expect(sidoCodesOf('metro')).toEqual(['110000', '310000']);
    expect(sidoCodesOf('gyeonggi')).toEqual(['310000']);
    expect(sidoCodesOf('all')).toEqual([]);
  });

  it('기본 지역은 링크에서 뺀다', () => {
    expect(regionQuery('metro')).toEqual({});
    expect(regionQuery('all')).toEqual({ region: 'all' });
  });
});
