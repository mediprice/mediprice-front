import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { ACCESS_COOKIE } from '@/lib/bff/cookies';
import { bffRequest } from '@/test/request';
import { API, server } from '@/test/server';

import { DELETE, GET, PATCH, POST, PUT } from './route';

const ctx = (...path: string[]) => ({ params: Promise.resolve({ path }) });
const withAccess = { [ACCESS_COOKIE]: 'a1' };

describe('GET /bff/api/**', () => {
  it('Access 쿠키를 Authorization으로 바꿔 백엔드에 전달하고 응답을 그대로 돌려준다', async () => {
    let seen: Headers | undefined;
    server.use(
      http.get(`${API}/api/hospitals/H1`, ({ request }) => {
        seen = request.headers;
        return HttpResponse.json({ ykiho: 'H1' });
      }),
    );

    const response = await GET(
      bffRequest('/bff/api/hospitals/H1', { cookies: withAccess }),
      ctx('api', 'hospitals', 'H1'),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ykiho: 'H1' });
    expect(seen?.get('authorization')).toBe('Bearer a1');
    expect(seen?.has('cookie')).toBe(false);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('Access 쿠키가 없으면 Authorization 없이 전달한다', async () => {
    let seen: Headers | undefined;
    server.use(
      http.get(`${API}/api/regions/sido`, ({ request }) => {
        seen = request.headers;
        return HttpResponse.json([]);
      }),
    );

    await GET(
      bffRequest('/bff/api/regions/sido'),
      ctx('api', 'regions', 'sido'),
    );

    expect(seen?.has('authorization')).toBe(false);
  });

  it('쿼리 문자열을 그대로 전달한다', async () => {
    let seenUrl = '';
    server.use(
      http.get(`${API}/api/hospitals`, ({ request }) => {
        seenUrl = request.url;
        return HttpResponse.json({ content: [] });
      }),
    );

    await GET(
      bffRequest('/bff/api/hospitals?keyword=%EB%B3%91%EC%9B%90&size=5'),
      ctx('api', 'hospitals'),
    );

    expect(new URL(seenUrl).search).toBe('?keyword=%EB%B3%91%EC%9B%90&size=5');
  });

  it.each([
    [404, { code: 'HOSPITAL_NOT_FOUND', message: '없음', errors: [] }],
    [401, { code: 'EXPIRED_ACCESS_TOKEN', message: '만료', errors: [] }],
  ])(
    '백엔드의 %i 응답을 그대로 전달한다(재발급은 클라이언트가 판단)',
    async (status, body) => {
      server.use(
        http.get(`${API}/api/x`, () => HttpResponse.json(body, { status })),
      );

      const response = await GET(bffRequest('/bff/api/x'), ctx('api', 'x'));

      expect(response.status).toBe(status);
      expect(await response.json()).toEqual(body);
    },
  );

  it('백엔드가 내려준 Set-Cookie는 브라우저로 전달하지 않는다', async () => {
    server.use(
      http.get(`${API}/api/x`, () =>
        HttpResponse.json(
          {},
          { headers: { 'Set-Cookie': 'JSESSIONID=1; Path=/' } },
        ),
      ),
    );

    const response = await GET(bffRequest('/bff/api/x'), ctx('api', 'x'));

    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it('백엔드에 닿지 못하면 502다', async () => {
    server.use(http.get(`${API}/api/x`, () => HttpResponse.error()));

    const response = await GET(bffRequest('/bff/api/x'), ctx('api', 'x'));

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });
});

describe('상태를 바꾸는 메서드', () => {
  it('POST 본문과 Content-Type을 그대로 전달한다', async () => {
    let seenBody: unknown;
    let seenType: string | null = null;
    server.use(
      http.post(`${API}/api/hospitals/H1/reviews`, async ({ request }) => {
        seenType = request.headers.get('content-type');
        seenBody = await request.json();
        return HttpResponse.json({ id: 1 }, { status: 201 });
      }),
    );

    const response = await POST(
      bffRequest('/bff/api/hospitals/H1/reviews', {
        method: 'POST',
        cookies: withAccess,
        body: { rating: 5, content: '좋아요' },
      }),
      ctx('api', 'hospitals', 'H1', 'reviews'),
    );

    expect(response.status).toBe(201);
    expect(seenType).toBe('application/json');
    expect(seenBody).toEqual({ rating: 5, content: '좋아요' });
  });

  it.each([
    ['PUT', PUT],
    ['PATCH', PATCH],
    ['DELETE', DELETE],
  ])('%s도 전달한다', async (method, handler) => {
    let seenMethod = '';
    server.use(
      http.all(`${API}/api/x`, ({ request }) => {
        seenMethod = request.method;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const response = await handler(
      bffRequest('/bff/api/x', { method }),
      ctx('api', 'x'),
    );

    expect(response.status).toBe(204);
    expect(seenMethod).toBe(method);
  });

  it('다른 출처에서 온 요청은 403이고 백엔드를 부르지 않는다', async () => {
    const response = await POST(
      bffRequest('/bff/api/x', {
        method: 'POST',
        body: {},
        origin: 'https://evil.example',
      }),
      ctx('api', 'x'),
    );

    expect(response.status).toBe(403);
  });
});

describe('경로 제한', () => {
  it.each([
    ['api가 아닌 경로', ['admin', 'x']],
    ['경로 이탈', ['api', '..', 'x']],
    ['이중 인코딩', ['api', '%2e%2e', 'x']],
    ['빈 경로', []],
  ])('%s는 404이고 백엔드를 부르지 않는다', async (_name, path) => {
    const response = await GET(bffRequest('/bff/api/x'), ctx(...path));

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });
});
