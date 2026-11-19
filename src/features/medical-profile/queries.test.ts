import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as ClientModule from '@/lib/api/client';
import { server } from '@/test/server';

import {
  type MedicalProfile,
  medicalProfileKeys,
  medicalProfileMutations,
  medicalProfileQueries,
} from './queries';

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    apiClient: actual.createApiClient({ baseUrl: 'http://app.test/bff' }),
  };
});

const BASE = 'http://app.test/bff';
const URL_PATH = `${BASE}/api/users/me/medical-profile`;

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

    await observer.mutate({ birthYear: 1985, gender: 'FEMALE' });

    expect(body).toEqual({ birthYear: 1985, gender: 'FEMALE' });
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

    await expect(observer.mutate({ birthYear: 3000 })).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      fieldErrors: [{ field: 'birthYear' }],
    });
    expect(client.getQueryData(medicalProfileKeys.mine())).toEqual(profile);
  });

  it('삭제하면 캐시를 null(빈 상태)로 바꾼다', async () => {
    const client = newClient();
    client.setQueryData(medicalProfileKeys.mine(), profile);
    server.use(
      http.delete(URL_PATH, () => new HttpResponse(null, { status: 204 })),
    );
    const observer = new MutationObserver(
      client,
      medicalProfileMutations.remove(),
    );

    await observer.mutate();

    expect(client.getQueryData(medicalProfileKeys.mine())).toBeNull();
  });

  it('삭제가 실패하면 프로필을 그대로 둔다', async () => {
    const client = newClient();
    client.setQueryData(medicalProfileKeys.mine(), profile);
    server.use(http.delete(URL_PATH, () => error(500, 'INTERNAL_ERROR')));
    const observer = new MutationObserver(
      client,
      medicalProfileMutations.remove(),
    );

    await expect(observer.mutate()).rejects.toMatchObject({ status: 500 });
    expect(client.getQueryData(medicalProfileKeys.mine())).toEqual(profile);
  });
});
