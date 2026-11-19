import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { createUntypedRequest } from '@/lib/api/untyped-request';
import { server } from '@/test/server';

import { createClaimApi } from './api';

const BASE = 'http://app.test/bff';
const api = createClaimApi(createUntypedRequest({ baseUrl: BASE }));

describe('createClaimApi', () => {
  it('접수 번호와 기한이 없는 응답은 INVALID_RESPONSE로 실패한다', async () => {
    server.use(
      http.post(`${BASE}/api/reviews/11/claims`, () =>
        HttpResponse.json(
          { id: 3, temporaryUntil: '2026-12-19' },
          { status: 201 },
        ),
      ),
    );

    await expect(
      api.submit(11, {
        reason: 'OTHER',
        description: '내용',
        claimantRole: 'AGENT',
        claimantName: '대리인',
        claimantEmail: 'agent@example.com',
        agreement: true,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('연결에 실패하면 NetworkError다', async () => {
    server.use(
      http.get(`${BASE}/api/claims/privacy-notice`, () => HttpResponse.error()),
    );

    await expect(api.fetchNotice()).rejects.toMatchObject({
      name: 'NetworkError',
    });
  });
});
