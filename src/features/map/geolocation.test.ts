import { describe, expect, it, vi } from 'vitest';

import { locateOnce, readPermission } from './geolocation';

type Success = Parameters<Geolocation['getCurrentPosition']>[0];
type Failure = NonNullable<Parameters<Geolocation['getCurrentPosition']>[1]>;

function fakeGeolocation(
  respond: (success: Success, failure: Failure) => void,
) {
  return {
    getCurrentPosition: vi.fn((success: Success, failure?: Failure | null) => {
      respond(success, failure ?? (() => {}));
    }),
  };
}

const at = (latitude: number, longitude: number) =>
  ({ coords: { latitude, longitude } }) as unknown as GeolocationPosition;
const failWith = (code: number) =>
  ({ code }) as unknown as GeolocationPositionError;

describe('locateOnce', () => {
  it('서울시청에서 허용하면 반올림한 현재 위치를 돌려준다', async () => {
    const geolocation = fakeGeolocation((success) =>
      success(at(37.566535123, 126.977969999)),
    );

    await expect(locateOnce(geolocation)).resolves.toEqual({
      status: 'located',
      position: { lat: 37.56654, lng: 126.97797 },
    });
    expect(geolocation.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: false, timeout: 10000 }),
    );
  });

  it('사용자가 거부하면(code 1) denied다', async () => {
    const geolocation = fakeGeolocation((_, failure) => failure(failWith(1)));
    await expect(locateOnce(geolocation)).resolves.toEqual({
      status: 'denied',
    });
  });

  it('위치를 못 얻거나(code 2) 시간이 지나면(code 3) unavailable이다', async () => {
    for (const code of [2, 3]) {
      const geolocation = fakeGeolocation((_, failure) =>
        failure(failWith(code)),
      );
      await expect(locateOnce(geolocation)).resolves.toEqual({
        status: 'unavailable',
      });
    }
  });

  it('한국 밖(도쿄)이면 outside다', async () => {
    const geolocation = fakeGeolocation((success) =>
      success(at(35.6812, 139.7671)),
    );
    await expect(locateOnce(geolocation)).resolves.toEqual({
      status: 'outside',
    });
  });

  it('위치 API가 없는 브라우저는 거부가 아니라 unavailable이다', async () => {
    await expect(locateOnce(undefined)).resolves.toEqual({
      status: 'unavailable',
    });
  });
});

describe('readPermission', () => {
  it.each(['granted', 'prompt', 'denied'] as const)(
    '권한 API가 알려 준 상태(%s)를 그대로 돌려준다',
    async (state) => {
      const status = { state };
      const result = await readPermission({
        query: vi.fn().mockResolvedValue(status),
      });
      expect(result).toEqual({ state, status });
    },
  );

  it('권한 API가 없으면 unsupported다', async () => {
    await expect(readPermission(undefined)).resolves.toEqual({
      state: 'unsupported',
      status: null,
    });
  });

  it('권한 조회가 실패해도(일부 브라우저의 TypeError) unsupported로 끝난다', async () => {
    const result = await readPermission({
      query: vi.fn().mockRejectedValue(new TypeError('not supported')),
    });
    expect(result).toEqual({ state: 'unsupported', status: null });
  });
});
