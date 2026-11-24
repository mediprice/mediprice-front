import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { createUntypedRequest } from '@/lib/api/untyped-request';
import { server } from '@/test/server';

import { createAdminClaimApi } from './claim-api';

const BASE = 'http://app.test/bff';
const api = createAdminClaimApi(createUntypedRequest({ baseUrl: BASE }));

describe('createAdminClaimApi', () => {
  it('없는 신고는 ApiError(CLAIM_NOT_FOUND)로 실패한다', async () => {
    server.use(
      http.get(`${BASE}/api/admin/claims/99`, () =>
        HttpResponse.json(
          { code: 'CLAIM_NOT_FOUND', message: '없음', errors: [] },
          { status: 404 },
        ),
      ),
    );

    await expect(api.detail(99)).rejects.toMatchObject({
      status: 404,
      code: 'CLAIM_NOT_FOUND',
    });
  });

  it('시간대 없는 날짜가 오면 INVALID_RESPONSE로 실패한다', async () => {
    server.use(
      http.get(`${BASE}/api/admin/claims/5`, () =>
        HttpResponse.json({ id: 5, createdAt: '2026-11-19T03:00:00' }),
      ),
    );

    await expect(api.detail(5)).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });
});
