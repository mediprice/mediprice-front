import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { createUntypedRequest } from '@/lib/api/untyped-request';
import { server } from '@/test/server';

import { createLocationUsageApi } from './location-usage-api';

const BASE = 'http://app.test/bff';
const USAGES = `${BASE}/api/users/me/location-usages`;
const api = createLocationUsageApi(createUntypedRequest({ baseUrl: BASE }));

describe('createLocationUsageApi', () => {
  it('목적을 본문에 담아 POST하고 204를 받는다', async () => {
    let body: unknown;
    server.use(
      http.post(USAGES, async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(api.record()).resolves.toBeUndefined();
    expect(body).toEqual({ purpose: 'NEARBY_HOSPITALS' });
  });

  it('동의가 없으면 ApiError(LOCATION_CONSENT_REQUIRED)로 실패한다', async () => {
    server.use(
      http.post(USAGES, () =>
        HttpResponse.json(
          { code: 'LOCATION_CONSENT_REQUIRED', message: '필요', errors: [] },
          { status: 403 },
        ),
      ),
    );

    await expect(api.record()).rejects.toMatchObject({
      status: 403,
      code: 'LOCATION_CONSENT_REQUIRED',
    });
  });
});
