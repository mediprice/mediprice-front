import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  callBackend,
  forwardHeaders,
  isAnonymousRequest,
  isSameOrigin,
  resolveBackendUrl,
} from './upstream';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

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
    ['api만 있는 경로', ['api']],
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

  it('Vercel에서는 플랫폼이 알려준 원래 호스트와 비교한다', () => {
    vi.stubEnv('VERCEL', '1');

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

  it('Vercel 밖에서는 X-Forwarded-Host를 믿지 않는다', () => {
    expect(
      isSameOrigin(
        request('POST', {
          host: 'localhost:3000',
          'x-forwarded-host': 'evil.example',
          origin: 'https://evil.example',
        }),
      ),
    ).toBe(false);
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

  it('공유 비밀값이 있으면 사용자 IP를 함께 보낸다', () => {
    const withIp = new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' });

    const headers = forwardHeaders(withIp, undefined, 'secret-0123456789');

    expect(headers.get('x-mediprice-client-ip')).toBe('203.0.113.7');
    expect(headers.get('x-mediprice-bff-secret')).toBe('secret-0123456789');
  });

  it('공유 비밀값이 없거나 IP 형식이 아니면 IP를 보내지 않는다', () => {
    const withIp = new Headers({ 'x-real-ip': '203.0.113.7' });
    const spoofed = new Headers({ 'x-forwarded-for': 'evil<script>' });

    expect(
      forwardHeaders(withIp, undefined, undefined).has('x-mediprice-client-ip'),
    ).toBe(false);
    expect(
      forwardHeaders(spoofed, undefined, 'secret-0123456789').has(
        'x-mediprice-client-ip',
      ),
    ).toBe(false);
  });

  it('브라우저가 보낸 비밀값·IP 헤더는 그대로 넘기지 않는다', () => {
    const forged = new Headers({
      'x-mediprice-bff-secret': 'guess',
      'x-mediprice-client-ip': '1.2.3.4',
    });

    const headers = forwardHeaders(forged, undefined, undefined);

    expect(headers.has('x-mediprice-bff-secret')).toBe(false);
    expect(headers.has('x-mediprice-client-ip')).toBe(false);
  });

  it('브라우저의 User-Agent를 그대로 전달한다(동의 기록 근거)', () => {
    const withAgent = new Headers({ 'user-agent': 'Mozilla/5.0 Test' });

    expect(forwardHeaders(withAgent).get('user-agent')).toBe(
      'Mozilla/5.0 Test',
    );
  });

  it('익명 요청 표시 헤더는 백엔드로 넘기지 않는다', () => {
    const anonymous = new Headers({ 'x-mediprice-anonymous': '1' });

    expect(forwardHeaders(anonymous).has('x-mediprice-anonymous')).toBe(false);
  });

  it('Access가 없으면 브라우저가 보낸 Authorization도 지운다', () => {
    expect(forwardHeaders(incoming, undefined).has('authorization')).toBe(
      false,
    );
  });
});

describe('isAnonymousRequest', () => {
  it('익명 요청 헤더가 1일 때만 익명으로 본다', () => {
    expect(
      isAnonymousRequest(new Headers({ 'x-mediprice-anonymous': '1' })),
    ).toBe(true);
    expect(
      isAnonymousRequest(new Headers({ 'x-mediprice-anonymous': 'yes' })),
    ).toBe(false);
    expect(isAnonymousRequest(new Headers())).toBe(false);
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

  it('제한 시간 신호를 붙여 호출한다', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));

    await callBackend(new URL('http://api.test/api/x'), { method: 'GET' });

    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it('호출하는 쪽이 정해도 리다이렉트를 따라가지 않는다', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
    const init: RequestInit = { method: 'POST', redirect: 'follow' };

    await callBackend(new URL('http://api.test/api/x'), init);

    expect(fetchMock.mock.calls[0]?.[1]?.redirect).toBe('manual');
  });

  it('호출하는 쪽의 취소 신호를 함께 전달한다', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
    const controller = new AbortController();

    await callBackend(new URL('http://api.test/api/x'), {
      signal: controller.signal,
    });
    const signal = fetchMock.mock.calls[0]?.[1]?.signal;
    controller.abort();

    expect(signal).not.toBe(controller.signal);
    expect(signal?.aborted).toBe(true);
  });

  it('제한 시간을 넘기면 504 UPSTREAM_TIMEOUT을 돌려준다', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new DOMException(
        'The operation was aborted due to timeout',
        'TimeoutError',
      ),
    );

    const response = await callBackend(new URL('http://api.test/api/x'), {});

    expect(response.status).toBe(504);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({ code: 'UPSTREAM_TIMEOUT' });
  });
});
