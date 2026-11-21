import { afterEach, describe, expect, it, vi } from 'vitest';

import { unwrap } from '@/lib/api/unwrap';

import { createPublicApi } from './public-client';

afterEach(() => vi.restoreAllMocks());

function mockFetch() {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () => Response.json({ content: [] }));
}

describe('createPublicApi', () => {
  it('백엔드 주소로 바로 부르고 조건 객체를 평평한 쿼리로 보낸다', async () => {
    const fetchMock = mockFetch();
    const api = createPublicApi({ revalidate: 300 });

    await unwrap(
      api.GET('/api/npay-items/{npayCode}/price-summary', {
        params: {
          path: { npayCode: 'MX1220000' },
          query: { condition: { sidoCode: '110000' } },
        },
      }),
    );

    const [request] = fetchMock.mock.calls[0] ?? [];
    expect(request).toBeInstanceOf(Request);
    expect((request as Request).url).toBe(
      'http://api.test/api/npay-items/MX1220000/price-summary?sidoCode=110000',
    );
  });

  it('쿠키·Authorization 없이 익명으로 보내고 데이터 캐시 시간과 제한 시간을 건다', async () => {
    const fetchMock = mockFetch();
    const api = createPublicApi({ revalidate: 86_400 });

    await unwrap(
      api.GET('/api/hospitals/{ykiho}', { params: { path: { ykiho: 'H1' } } }),
    );

    const [request, init] = fetchMock.mock.calls[0] ?? [];
    const headers = (request as Request).headers;
    expect(headers.get('authorization')).toBeNull();
    expect(headers.get('cookie')).toBeNull();
    expect(init).toMatchObject({ next: { revalidate: 86_400 } });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });
});
