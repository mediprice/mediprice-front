import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { createUntypedRequest } from '@/lib/api/untyped-request';
import { server } from '@/test/server';

import { createConsentApi } from './consent-api';
import { requiredConsentDecisions } from './required-consent';

const BASE = 'http://app.test/bff';
const CONSENTS = `${BASE}/api/users/me/consents`;
const api = createConsentApi(createUntypedRequest({ baseUrl: BASE }));

const status = {
  requiredConsentsMissing: false,
  consents: [
    {
      type: 'TERMS',
      required: true,
      currentVersion: '2026-11-19',
      agreed: true,
      agreedVersion: '2026-11-19',
      agreedAt: '2026-11-19T01:00:00Z',
      withdrawnAt: null,
      reconsentRequired: false,
    },
  ],
};

describe('createConsentApi', () => {
  it('필수 동의를 { consents: [...] } 본문으로 보내고 바뀐 현황을 받는다', async () => {
    let body: unknown;
    server.use(
      http.post(CONSENTS, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(status);
      }),
    );

    await expect(api.save(requiredConsentDecisions())).resolves.toEqual(status);
    expect(body).toEqual({ consents: requiredConsentDecisions() });
  });

  it('버전이 다르면 ApiError(CONSENT_VERSION_OUTDATED)로 실패한다', async () => {
    server.use(
      http.post(CONSENTS, () =>
        HttpResponse.json(
          { code: 'CONSENT_VERSION_OUTDATED', message: '바뀜', errors: [] },
          { status: 409 },
        ),
      ),
    );

    await expect(api.save(requiredConsentDecisions())).rejects.toMatchObject({
      status: 409,
      code: 'CONSENT_VERSION_OUTDATED',
    });
  });

  it('모양이 다른 응답은 INVALID_RESPONSE로 실패한다', async () => {
    server.use(http.get(CONSENTS, () => HttpResponse.json({ consents: 1 })));

    await expect(api.fetchStatus()).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('연결에 실패하면 NetworkError다', async () => {
    server.use(http.get(CONSENTS, () => HttpResponse.error()));

    await expect(api.fetchStatus()).rejects.toMatchObject({
      name: 'NetworkError',
    });
  });
});
