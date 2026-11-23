import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildSdkUrl,
  loadNaverMaps,
  onNaverAuthFailure,
  resetNaverSdkForTest,
  runCleanup,
} from './naver-sdk';
import type { NaverMapsApi } from './naver-types';

function fakeTarget() {
  const scripts: {
    src: string;
    async: boolean;
    onload: (() => void) | null;
    onerror: (() => void) | null;
  }[] = [];
  const target = {
    window: {} as {
      naver?: { maps?: NaverMapsApi };
      navermap_authFailure?: () => void;
    },
    document: {
      createElement: () => {
        const script = { src: '', async: false, onload: null, onerror: null };
        scripts.push(script);
        return script;
      },
      head: { append: vi.fn() },
    },
  };
  return { target, scripts };
}

const fakeApi = {} as NaverMapsApi;

afterEach(() => resetNaverSdkForTest());

describe('buildSdkUrl', () => {
  it('통합 콘솔 키 이름(ncpKeyId)으로 Client ID를 붙인다', () => {
    expect(buildSdkUrl('abc 123')).toBe(
      'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=abc+123',
    );
  });
});

describe('loadNaverMaps', () => {
  it('스크립트를 한 번만 넣고, 로드되면 naver.maps를 돌려준다', async () => {
    const { target, scripts } = fakeTarget();
    const first = loadNaverMaps('key', target);
    const second = loadNaverMaps('key', target);
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.async).toBe(true);

    target.window.naver = { maps: fakeApi };
    scripts[0]?.onload?.();

    await expect(first).resolves.toBe(fakeApi);
    expect(second).toBe(first);
  });

  it('이미 SDK가 있으면 스크립트를 넣지 않는다', async () => {
    const { target, scripts } = fakeTarget();
    target.window.naver = { maps: fakeApi };
    await expect(loadNaverMaps('key', target)).resolves.toBe(fakeApi);
    expect(scripts).toHaveLength(0);
  });

  it('네트워크 실패는 거부하고, 다음 호출에서 다시 불러온다', async () => {
    const { target, scripts } = fakeTarget();
    const failed = loadNaverMaps('key', target);
    scripts[0]?.onerror?.();
    await expect(failed).rejects.toThrow('failed to load');

    void loadNaverMaps('key', target);
    expect(scripts).toHaveLength(2);
  });

  it('스크립트는 왔는데 naver.maps가 없으면 실패다', async () => {
    const { target, scripts } = fakeTarget();
    const promise = loadNaverMaps('key', target);
    scripts[0]?.onload?.();
    await expect(promise).rejects.toThrow('without naver.maps');
  });
});

describe('onNaverAuthFailure', () => {
  it('SDK가 인증 실패를 알리면 구독자에게 전하고, 나중에 구독해도 바로 알린다', () => {
    const { target } = fakeTarget();
    void loadNaverMaps('key', target);
    const early = vi.fn();
    const unsubscribe = onNaverAuthFailure(early);

    target.window.navermap_authFailure?.();
    expect(early).toHaveBeenCalledTimes(1);

    const late = vi.fn();
    onNaverAuthFailure(late);
    expect(late).toHaveBeenCalledTimes(1);

    unsubscribe();
    target.window.navermap_authFailure?.();
    expect(early).toHaveBeenCalledTimes(1);
  });
});

describe('runCleanup', () => {
  it('정리 중 던져진 오류를 삼킨다', () => {
    expect(() =>
      runCleanup(() => {
        throw new TypeError(
          "Cannot read properties of null (reading 'isArray')",
        );
      }),
    ).not.toThrow();
  });

  it('정상이면 정리를 실행한다', () => {
    const cleanup = vi.fn();
    runCleanup(cleanup);
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
