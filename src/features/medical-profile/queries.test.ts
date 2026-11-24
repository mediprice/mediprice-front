import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { consentKeys } from '@/features/auth/queries';
import type * as PathsModule from '@/lib/api/paths';
import { server } from '@/test/server';

import {
  type MedicalProfile,
  medicalProfileKeys,
  medicalProfileMutations,
  medicalProfileQueries,
} from './queries';

vi.mock('@/lib/api/paths', async (importOriginal) => {
  const actual = await importOriginal<typeof PathsModule>();
  return { ...actual, BFF_BASE: 'http://app.test/bff' };
});

const BASE = 'http://app.test/bff';
const URL_PATH = `${BASE}/api/users/me/medical-profile`;
const CONSENT_PATH = `${BASE}/api/users/me/consents/MEDICAL_PROFILE`;

const profile: MedicalProfile = {
  birthYear: 1985,
  gender: 'FEMALE',
  chronicConditions: '고혈압',
  medications: null,
  allergies: '페니실린',
  note: null,
  updatedAt: '2026-10-12T01:00:00Z',
};

const error = (status: number, code: string) =>
  HttpResponse.json({ code, message: '오류', errors: [] }, { status });

function newClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
}

describe('medicalProfileQueries.mine', () => {
  it('저장한 프로필을 돌려준다', async () => {
    server.use(http.get(URL_PATH, () => HttpResponse.json(profile)));

    expect(await newClient().fetchQuery(medicalProfileQueries.mine())).toEqual(
      profile,
    );
  });

  it('저장한 적이 없으면(404 MEDICAL_PROFILE_NOT_FOUND) 에러가 아니라 null이다', async () => {
    server.use(
      http.get(URL_PATH, () => error(404, 'MEDICAL_PROFILE_NOT_FOUND')),
    );

    expect(
      await newClient().fetchQuery(medicalProfileQueries.mine()),
    ).toBeNull();
  });

  it('다른 404나 장애는 그대로 던진다', async () => {
    server.use(http.get(URL_PATH, () => error(404, 'NOT_FOUND')));
    await expect(
      newClient().fetchQuery(medicalProfileQueries.mine()),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    server.use(http.get(URL_PATH, () => error(500, 'INTERNAL_ERROR')));
    await expect(
      newClient().fetchQuery(medicalProfileQueries.mine()),
    ).rejects.toMatchObject({ status: 500 });
  });
});

describe('medicalProfileMutations', () => {
  it('저장하면 PUT 본문을 그대로 보내고 응답으로 캐시를 바꾼다', async () => {
    const client = newClient();
    client.setQueryData(medicalProfileKeys.mine(), null);
    let body: unknown;
    server.use(
      http.put(URL_PATH, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(profile);
      }),
    );
    const observer = new MutationObserver(
      client,
      medicalProfileMutations.save(),
    );

    await observer.mutate({
      birthYear: 1985,
      gender: 'FEMALE',
      consentVersion: '2026-11-19',
    });

    expect(body).toEqual({
      birthYear: 1985,
      gender: 'FEMALE',
      consentVersion: '2026-11-19',
    });
    expect(client.getQueryData(medicalProfileKeys.mine())).toEqual(profile);
  });

  it('저장이 거부되면(INVALID_INPUT) 칸 정보와 함께 실패하고 캐시는 그대로다', async () => {
    const client = newClient();
    client.setQueryData(medicalProfileKeys.mine(), profile);
    server.use(
      http.put(URL_PATH, () =>
        HttpResponse.json(
          {
            code: 'INVALID_INPUT',
            message: '잘못된 입력',
            errors: [{ field: 'birthYear', reason: 'must be <= 2100' }],
          },
          { status: 400 },
        ),
      ),
    );
    const observer = new MutationObserver(
      client,
      medicalProfileMutations.save(),
    );

    await expect(
      observer.mutate({ birthYear: 3000, consentVersion: '2026-11-19' }),
    ).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      fieldErrors: [{ field: 'birthYear' }],
    });
    expect(client.getQueryData(medicalProfileKeys.mine())).toEqual(profile);
  });

  it('동의가 바뀌었으면 409 MEDICAL_PROFILE_CONSENT_REQUIRED로 실패한다', async () => {
    server.use(
      http.put(URL_PATH, () => error(409, 'MEDICAL_PROFILE_CONSENT_REQUIRED')),
    );
    const observer = new MutationObserver(
      newClient(),
      medicalProfileMutations.save(),
    );

    await expect(
      observer.mutate({ consentVersion: '2026-11-19' }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'MEDICAL_PROFILE_CONSENT_REQUIRED',
    });
  });

  it('동의를 철회하면 동의 API를 부르고 프로필 캐시를 null로, 동의 현황은 다시 받게 한다', async () => {
    const client = newClient();
    client.setQueryData(medicalProfileKeys.mine(), profile);
    client.setQueryData(consentKeys.status(), {
      requiredConsentsMissing: false,
    });
    const called: string[] = [];
    server.use(
      http.delete(CONSENT_PATH, () => {
        called.push('consent');
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const observer = new MutationObserver(
      client,
      medicalProfileMutations.withdraw(),
    );

    await observer.mutate();

    expect(called).toEqual(['consent']);
    expect(client.getQueryData(medicalProfileKeys.mine())).toBeNull();
    expect(client.getQueryState(consentKeys.status())?.isInvalidated).toBe(
      true,
    );
  });

  it('동의 API가 없는 백엔드(404 RESOURCE_NOT_FOUND)면 프로필 삭제로 대신한다', async () => {
    const client = newClient();
    client.setQueryData(medicalProfileKeys.mine(), profile);
    const called: string[] = [];
    server.use(
      http.delete(CONSENT_PATH, () => error(404, 'RESOURCE_NOT_FOUND')),
      http.delete(URL_PATH, () => {
        called.push('profile');
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const observer = new MutationObserver(
      client,
      medicalProfileMutations.withdraw(),
    );

    await observer.mutate();

    expect(called).toEqual(['profile']);
    expect(client.getQueryData(medicalProfileKeys.mine())).toBeNull();
  });

  it('철회가 실패하면 프로필을 그대로 둔다', async () => {
    const client = newClient();
    client.setQueryData(medicalProfileKeys.mine(), profile);
    server.use(http.delete(CONSENT_PATH, () => error(500, 'INTERNAL_ERROR')));
    const observer = new MutationObserver(
      client,
      medicalProfileMutations.withdraw(),
    );

    await expect(observer.mutate()).rejects.toMatchObject({ status: 500 });
    expect(client.getQueryData(medicalProfileKeys.mine())).toEqual(profile);
  });
});
