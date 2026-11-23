import { describe, expect, it } from 'vitest';

import { isTrayHiddenOn } from './tray-visibility';

describe('isTrayHiddenOn', () => {
  it('비교·지도·내 정보·법적 문서 화면에서는 숨긴다', () => {
    for (const path of [
      '/compare',
      '/map',
      '/my/medical-profile',
      '/my/history',
      '/privacy',
      '/terms',
      '/location-terms',
      '/policy/reviews',
    ]) {
      expect(isTrayHiddenOn(path)).toBe(true);
    }
  });

  it('검색·항목·병원 화면에서는 보인다', () => {
    for (const path of [
      '/search',
      '/items/MX1220000',
      '/hospitals/abc',
      '/compare-x',
    ]) {
      expect(isTrayHiddenOn(path)).toBe(false);
    }
  });
});
