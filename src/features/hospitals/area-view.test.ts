import { describe, expect, it } from 'vitest';

import { areaViewRadius } from './area-view';

const SELF = 'H0';
const near = (...meters: number[]) =>
  meters.map((distanceMeters, index) => ({
    ykiho: `H${index + 1}`,
    distanceMeters,
  }));

describe('areaViewRadius', () => {
  it('이웃이 없으면 최소 반경이다', () => {
    expect(areaViewRadius(undefined, SELF)).toBe(400);
    expect(areaViewRadius([], SELF)).toBe(400);
  });

  it('네 번째로 가까운 이웃까지 보이게 넓히되 최대 반경을 넘지 않는다', () => {
    expect(areaViewRadius(near(100, 200, 300, 500, 900), SELF)).toBe(575);
    expect(areaViewRadius(near(100, 200, 300, 950), SELF)).toBe(1000);
  });

  it('이 병원 자신은 이웃으로 세지 않는다', () => {
    const list = [{ ykiho: SELF, distanceMeters: 0 }, ...near(600)];

    expect(areaViewRadius(list, SELF)).toBe(690);
  });

  it('다시 받은 목록이 새 배열이어도 거리가 같으면 같은 반경이라 지도를 다시 맞추지 않는다', () => {
    const first = areaViewRadius(near(100, 200, 300, 500), SELF);
    const refetched = areaViewRadius(near(100, 200, 300, 500), SELF);

    expect(refetched).toBe(first);
  });
});
