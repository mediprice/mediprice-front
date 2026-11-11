import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  callBackend,
  forwardHeaders,
  isSameOrigin,
  resolveBackendUrl,
} from './upstream';

afterEach(() => vi.restoreAllMocks());

describe('resolveBackendUrl', () => {
  it('/api 아래 경로를 백엔드 주소로 만든다', () => {
    expect(resolveBackendUrl(['api', 'hospitals', 'H1'], '?size=5')?.href).toBe(
      'http://api.test/api/hospitals/H1?size=5',
    );
  });

  it('세그먼트의 특수문자를 인코딩한다', () => {
    expect(resolveBackendUrl(['api', 'hospitals', 'a+b=='], '')?.pathname).toBe(
      '/api/hospitals/a%2Bb%3D%3D',
    );
  });

  it.each([
    ['api가 아닌 첫 세그먼트', ['admin', 'x']],
    ['빈 경로', []],
    ['..', ['api', '..', 'x']],
    ['.', ['api', '.', 'x']],
    ['빈 세그먼트', ['api', '', 'x']],
    ['슬래시를 품은 세그먼트', ['api', 'a/b']],
    ['역슬래시를 품은 세그먼트', ['api', 'a\\b']],
    ['이중 인코딩', ['api', '%2e%2e', 'x']],
  ])('%s는 거부한다', (_name, segments) => {
    expect(resolveBackendUrl(segments, '')).toBeNull();
  });
});

describe('isSameOrigin', () => {
  function request(method: string, headers: Record<string, string>) {
    return new NextRequest('http://localhost:3000/bff/api/x', {
      method,
      headers,
    });
  }

  it.each(['GET', 'HEAD', 'OPTIONS'])('%s는 Origin을 보지 않는다', (method) => {
    expect(isSameOrigin(request(method, {}))).toBe(true);
  });

  it('같은 호스트의 Origin이면 허용한다', () => {
    expect(
      isSameOrigin(
        request('POST', {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
        }),
      ),
    ).toBe(true);
  });

  it('프록시가 알려준 원래 호스트와 비교한다', () => {
    expect(
      isSameOrigin(
        request('POST', {
          host: 'internal:3000',
          'x-forwarded-host': 'app.mediprice.app',
          origin: 'https://app.mediprice.app',
        }),
      ),
    ).toBe(true);
  });

  it.each([
    ['다른 출처', { host: 'localhost:3000', origin: 'https://evil.example' }],
    ['Origin 없음', { host: 'localhost:3000' }],
    ['잘못된 Origin', { host: 'localhost:3000', origin: 'null' }],
  ])('POST에서 %s는 거부한다', (_name, headers) => {
    expect(isSameOrigin(request('POST', headers))).toBe(false);
  });
});

describe('forwardHeaders', () => {
  const incoming = new Headers({
    'content-type': 'application/json',
    accept: 'application/json',
    cookie: 'mp_access=secret',
    authorization: 'Bearer from-browser',
    'x-custom': 'nope',
  });

  it('필요한 헤더만 전달하고 Authorization을 Access로 바꾼다', () => {
    const headers = forwardHeaders(incoming, 'access-1');

    expect(headers.get('content-type')).toBe('application/json');
    expect(headers.get('accept')).toBe('application/json');
    expect(headers.get('authorization')).toBe('Bearer access-1');
    expect(headers.has('cookie')).toBe(false);
    expect(headers.has('x-custom')).toBe(false);
  });

  it('Access가 없으면 브라우저가 보낸 Authorization도 지운다', () => {
    expect(forwardHeaders(incoming, undefined).has('authorization')).toBe(
      false,
    );
  });
});

describe('callBackend', () => {
  it('백엔드 응답을 그대로 돌려준다', async () => {
    const upstream = new Response('{"ok":true}', { status: 201 });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(upstream);

    const response = await callBackend(new URL('http://api.test/api/x'), {
      method: 'POST',
    });

    expect(response).toBe(upstream);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('연결에 실패하면 502 UPSTREAM_UNAVAILABLE을 돌려준다', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new TypeError('fetch failed'),
    );

    const response = await callBackend(new URL('http://api.test/api/x'), {});

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });
});
