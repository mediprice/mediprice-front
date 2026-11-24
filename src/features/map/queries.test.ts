import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { isLocationConsentActive } from '@/features/auth/consent-status';
import { consentKeys, consentQueries } from '@/features/auth/queries';
import type * as ClientModule from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { server } from '@/test/server';

import { resolveLocationAccess } from './location-access';
import { locationUsageApi } from './location-usage-api';
import {
  locationUsageMutations,
  mapKeys,
  mapQueries,
  toNearbyCondition,
} from './queries';

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    apiClient: actual.createApiClient({ baseUrl: 'http://app.test/bff' }),
  };
});

const NEARBY = 'http://app.test/bff/api/hospitals/nearby';

const hospital = (ykiho: string, name: string, minPrice: number | null) => ({
  ykiho,
  name,
  className: '의원',
  address: '서울특별시 중구 세종대로 110',
  phone: null,
  latitude: 37.5667,
  longitude: 126.9782,
  distanceMeters: 84,
  minPrice,
});

const page = (
  content: ReturnType<typeof hospital>[],
  pageIndex: number,
  totalPages: number,
) => ({
  content,
  page: pageIndex,
  size: 50,
  totalElements: totalPages * 50,
  totalPages,
});

describe('toNearbyCondition', () => {
  it('지도 중심이 범위 밖이면 경계로 붙이고 반경을 100m~10km로 자른다', () => {
    expect(toNearbyCondition({ lat: 40.1, lng: 133.2, radius: 20000 })).toEqual(
      { lat: 39, lng: 132, radius: 10000 },
    );
  });

  it('미세한 이동은 같은 쿼리 키가 된다', () => {
    const a = mapKeys.nearby(
      toNearbyCondition({ lat: 37.566501, lng: 126.978001, radius: 1000 }),
    );
    const b = mapKeys.nearby(
      toNearbyCondition({ lat: 37.566504, lng: 126.977999, radius: 1000 }),
    );
    expect(a).toEqual(b);
  });

  it('좌표를 소수 둘째 자리(약 1km)로 흐려 보낸다', () => {
    expect(
      toNearbyCondition({ lat: 37.566535, lng: 126.977969, radius: 1000 }),
    ).toEqual({ lat: 37.57, lng: 126.98, radius: 1000 });
  });
});

describe('mapQueries.nearby', () => {
  it('좌표·반경·항목 코드·페이지를 평평한 쿼리로 보내고 병원별 최저가를 받는다', async () => {
    let url: URL | undefined;
    server.use(
      http.get(NEARBY, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(
          page([hospital('H1', '덕수한의원', 45000)], 0, 1),
        );
      }),
    );

    const data = await new QueryClient().fetchInfiniteQuery(
      mapQueries.nearby({
        lat: 37.5665,
        lng: 126.978,
        radius: 3000,
        npayCode: 'MX1220000',
      }),
    );

    expect(data.pages[0]?.content[0]).toMatchObject({
      name: '덕수한의원',
      minPrice: 45000,
    });
    expect(Object.fromEntries(url?.searchParams ?? [])).toEqual({
      lat: '37.57',
      lng: '126.98',
      radius: '3000',
      npayCode: 'MX1220000',
      page: '0',
      size: '50',
    });
  });

  it('로그인 쿠키를 쓰지 말라는 익명 요청 헤더를 붙인다', async () => {
    let headers: Headers | undefined;
    server.use(
      http.get(NEARBY, ({ request }) => {
        headers = request.headers;
        return HttpResponse.json(page([], 0, 0));
      }),
    );

    await new QueryClient().fetchInfiniteQuery(
      mapQueries.nearby({ lat: 37.5665, lng: 126.978, radius: 1000 }),
    );

    expect(headers?.get('x-mediprice-anonymous')).toBe('1');
  });

  it('항목이 없으면 npayCode를 보내지 않는다', async () => {
    let url: URL | undefined;
    server.use(
      http.get(NEARBY, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(page([], 0, 0));
      }),
    );

    await new QueryClient().fetchInfiniteQuery(
      mapQueries.nearby({ lat: 37.5665, lng: 126.978, radius: 1000 }),
    );

    expect(url?.searchParams.has('npayCode')).toBe(false);
  });

  it('다음 페이지가 있으면 이어서 받고, 마지막 페이지에서 멈춘다', async () => {
    const requested: string[] = [];
    server.use(
      http.get(NEARBY, ({ request }) => {
        const index = Number(new URL(request.url).searchParams.get('page'));
        requested.push(String(index));
        return HttpResponse.json(
          page([hospital(`H${index}`, `병원${index}`, null)], index, 2),
        );
      }),
    );
    const client = new QueryClient();
    const options = mapQueries.nearby({
      lat: 37.5665,
      lng: 126.978,
      radius: 1000,
    });

    const data = await client.fetchInfiniteQuery({ ...options, pages: 2 });

    expect(requested).toEqual(['0', '1']);
    expect(data.pages.map((p) => p.content[0]?.name)).toEqual([
      '병원0',
      '병원1',
    ]);
    expect(
      options.getNextPageParam(data.pages[1]!, data.pages, 1, [0, 1]),
    ).toBe(undefined);
  });

  it('없는 항목 코드는 ApiError(NPAY_ITEM_NOT_FOUND)로 실패한다', async () => {
    server.use(
      http.get(NEARBY, () =>
        HttpResponse.json(
          { code: 'NPAY_ITEM_NOT_FOUND', message: '없음', errors: [] },
          { status: 404 },
        ),
      ),
    );

    await expect(
      new QueryClient().fetchInfiniteQuery(
        mapQueries.nearby({
          lat: 37.5665,
          lng: 126.978,
          radius: 1000,
          npayCode: 'NOPE',
        }),
      ),
    ).rejects.toMatchObject({ status: 404, code: 'NPAY_ITEM_NOT_FOUND' });
  });

  it('백엔드 장애(503)는 ApiError로 위에 알린다', async () => {
    server.use(
      http.get(NEARBY, () =>
        HttpResponse.json(
          { code: 'UPSTREAM_UNAVAILABLE', message: '장애', errors: [] },
          { status: 503 },
        ),
      ),
    );

    await expect(
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }).fetchInfiniteQuery(
        mapQueries.nearby({ lat: 37.5665, lng: 126.978, radius: 1000 }),
      ),
    ).rejects.toMatchObject({ status: 503 });
  });
});

describe('locationUsageMutations.record', () => {
  async function recordFailingWith(error: Error) {
    vi.spyOn(locationUsageApi, 'record').mockRejectedValue(error);
    const queryClient = new QueryClient();
    queryClient.setQueryData(consentKeys.status(), { consents: [] });
    await queryClient
      .getMutationCache()
      .build(queryClient, locationUsageMutations.record(queryClient))
      .execute(undefined)
      .catch(() => undefined);
    return queryClient.getQueryState(consentKeys.status())?.isInvalidated;
  }

  it('동의가 없다고 하면(403) 동의 현황을 무효화한다', async () => {
    expect(
      await recordFailingWith(
        new ApiError(403, 'LOCATION_CONSENT_REQUIRED', 'x'),
      ),
    ).toBe(true);
  });

  it('다른 실패는 동의 현황을 건드리지 않는다', async () => {
    expect(
      await recordFailingWith(new ApiError(500, 'INTERNAL_ERROR', 'x')),
    ).toBe(false);
  });
});

describe('mapQueries.locationConsent', () => {
  const agreed = {
    requiredConsentsMissing: false,
    consents: [
      {
        type: 'LOCATION',
        required: false,
        currentVersion: '2026-11-23',
        agreed: true,
        agreedVersion: '2026-11-23',
        agreedAt: '2026-11-23T00:00:00Z',
        withdrawnAt: null,
        reconsentRequired: false,
      },
    ],
  };

  /** useQuery가 첫 렌더에 쓰는 결과(getOptimisticResult)로 화면이 붙자마자 내리는 판단을 본다. */
  function accessOnMount(options: ReturnType<typeof consentQueries.status>) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: 60 * 1000 } },
    });
    queryClient.setQueryData(consentKeys.status(), agreed);
    const defaulted = queryClient.defaultQueryOptions(options);
    defaulted._optimisticResults = 'optimistic';
    const result = new QueryObserver(
      queryClient,
      defaulted,
    ).getOptimisticResult(defaulted);
    return resolveLocationAccess({
      session: 'authenticated',
      consent: {
        isPending: result.isPending,
        isFetching: result.isFetching,
        isStale: result.isStale,
        isError: result.isError,
        isConsentActive: isLocationConsentActive(result.data),
      },
    });
  }

  it('방금 받은 동의가 캐시에 있어도 화면에 붙으면 다시 받기 전까지 판단하지 않는다', () => {
    expect(accessOnMount(mapQueries.locationConsent(true))).toBeNull();
  });

  it('기본 staleTime(60초)을 쓰면 다른 곳의 철회를 모른 채 바로 ready가 된다', () => {
    expect(accessOnMount(consentQueries.status())).toBe('ready');
  });
});
