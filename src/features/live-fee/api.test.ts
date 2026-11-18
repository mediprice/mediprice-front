import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { errorMessageKey } from '@/lib/api/error-message';
import { ApiError, NetworkError } from '@/lib/api/errors';
import { server } from '@/test/server';

import { createLiveFeeApi } from './api';

const BASE = 'http://app.test/bff';
const LIVE_FEE = `${BASE}/api/ai/live-fee`;

const body = {
  ykiho: 'Y1',
  yoyangCode: '12345678',
  source: 'HIRA_WEB',
  fetchedAt: '2026-11-18T05:20:00Z',
  items: [
    {
      code: 'MX1220000-01',
      name: '이학요법료/도수치료',
      dbMinPrice: 80000,
      dbMaxPrice: 80000,
      webMinPrice: 85000,
      webMaxPrice: 85000,
      webPublishedMonth: '2026-10',
      changed: true,
    },
  ],
};

const errorBody = (code: string, status: number) =>
  HttpResponse.json({ code, message: '백엔드 문구', errors: [] }, { status });

function setup() {
  const onSessionExpired = vi.fn();
  return createLiveFeeApi({ baseUrl: BASE, onSessionExpired });
}

describe('fetchLiveFee', () => {
  it('병원과 항목 코드를 쿼리로 보내고 검증한 응답을 돌려준다', async () => {
    let url: URL | undefined;
    server.use(
      http.get(LIVE_FEE, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(body);
      }),
    );

    const result = await setup().fetchLiveFee('JDQ4#1$2+=', 'MX1220000');

    expect(url?.searchParams.get('ykiho')).toBe('JDQ4#1$2+=');
    expect(url?.searchParams.get('npayCode')).toBe('MX1220000');
    expect(result).toEqual(body);
  });

  it('누리집 가격이 없는 항목(null)도 받아들인다', async () => {
    const empty = {
      ...body,
      items: [
        {
          ...body.items[0],
          webMinPrice: null,
          webMaxPrice: null,
          webPublishedMonth: null,
          changed: false,
        },
      ],
    };
    server.use(http.get(LIVE_FEE, () => HttpResponse.json(empty)));

    await expect(setup().fetchLiveFee('Y1', 'MX1220000')).resolves.toEqual(
      empty,
    );
  });

  it.each([
    ['AI_UNAVAILABLE', 502, 'aiUnavailable'],
    ['INVALID_INPUT', 400, 'invalidInput'],
    ['SOMETHING_NEW', 503, 'server'],
  ])('%s(%i)는 ApiError로 던지고 문구 키는 %s다', async (code, status, key) => {
    server.use(http.get(LIVE_FEE, () => errorBody(code, status)));

    const error: unknown = await setup()
      .fetchLiveFee('Y1', 'MX1220000')
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status, code });
    expect(errorMessageKey(error)).toBe(key);
  });

  it('응답 모양이 다르면 INVALID_RESPONSE로 던진다', async () => {
    server.use(
      http.get(LIVE_FEE, () =>
        HttpResponse.json({ ...body, fetchedAt: '어제', items: null }),
      ),
    );

    await expect(setup().fetchLiveFee('Y1', 'MX1220000')).rejects.toMatchObject(
      { code: 'INVALID_RESPONSE' },
    );
  });

  it('연결에 실패하면 NetworkError로 던진다', async () => {
    server.use(http.get(LIVE_FEE, () => HttpResponse.error()));

    await expect(
      setup().fetchLiveFee('Y1', 'MX1220000'),
    ).rejects.toBeInstanceOf(NetworkError);
  });

  it('취소하면 NetworkError로 바꾸지 않고 그대로 던진다', async () => {
    server.use(
      http.get(LIVE_FEE, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json(body);
      }),
    );
    const controller = new AbortController();

    const pending = setup().fetchLiveFee('Y1', 'MX1220000', {
      signal: controller.signal,
    });
    controller.abort();

    const error: unknown = await pending.catch((e: unknown) => e);
    expect(error).not.toBeInstanceOf(NetworkError);
  });
});
