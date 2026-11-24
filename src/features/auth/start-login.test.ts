import { afterEach, describe, expect, it, vi } from 'vitest';

import { startGoogleLogin } from './start-login';

function stubWindow(pathname: string, search = '') {
  const stored = new Map<string, string>();
  const assign = vi.fn();
  vi.stubGlobal('window', {
    location: { pathname, search, assign },
    sessionStorage: {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => stored.set(key, value),
      removeItem: (key: string) => stored.delete(key),
    },
  });
  return { assign, stored };
}

afterEach(() => vi.unstubAllGlobals());

describe('startGoogleLogin', () => {
  it('백엔드로 바로 가지 않고 BFF의 로그인 시작 경로로 이동한다', () => {
    const { assign, stored } = stubWindow('/items/A', '?region=seoul');

    startGoogleLogin();

    expect(assign).toHaveBeenCalledWith(
      '/bff/session/login?return_to=%2Fitems%2FA%3Fregion%3Dseoul',
    );
    expect(stored.get('mp:returnTo')).toBe('/items/A?region=seoul');
  });

  it('지정한 경로가 안전하지 않으면 먼저 저장한 경로를 넘긴다', () => {
    const { assign, stored } = stubWindow('/oauth/callback');
    stored.set('mp:returnTo', '/my');

    startGoogleLogin('/oauth/callback');

    expect(assign).toHaveBeenCalledWith('/bff/session/login?return_to=%2Fmy');
  });
});
