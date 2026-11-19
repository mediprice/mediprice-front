import { NextRequest } from 'next/server';

type Options = {
  method?: string;
  cookies?: Record<string, string>;
  body?: unknown;
  /** 기본은 같은 출처. `null`이면 Origin 헤더를 보내지 않는다. */
  origin?: string | null;
};

/** BFF 라우트 핸들러에 넘길 요청을 만든다. */
export function bffRequest(path: string, options: Options = {}) {
  const { method = 'GET', cookies = {}, body, origin } = options;
  const headers = new Headers({ host: 'localhost:3000' });
  if (origin !== null) headers.set('origin', origin ?? 'http://localhost:3000');
  const cookie = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  if (cookie) headers.set('cookie', cookie);
  if (body !== undefined) headers.set('content-type', 'application/json');

  return new NextRequest(`http://localhost:3000${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
