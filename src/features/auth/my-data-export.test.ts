import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api/errors';
import { createUntypedRequest } from '@/lib/api/untyped-request';
import { server } from '@/test/server';

import {
  createMyDataApi,
  isExportUnsupported,
  myDataFileName,
} from './my-data-export';

const BASE = 'http://app.test/bff';
const EXPORT = `${BASE}/api/users/me/export`;
const api = createMyDataApi(createUntypedRequest({ baseUrl: BASE }));

describe('myDataFileName', () => {
  it('한국 날짜로 mediprice-my-data-YYYYMMDD.json을 만든다', () => {
    expect(myDataFileName(new Date('2026-11-19T03:00:00Z'))).toBe(
      'mediprice-my-data-20261119.json',
    );
  });

  it('UTC로는 전날이어도 한국 자정이 지났으면 다음 날이다', () => {
    expect(myDataFileName(new Date('2026-11-19T15:30:00Z'))).toBe(
      'mediprice-my-data-20261120.json',
    );
  });
});

describe('isExportUnsupported', () => {
  it('경로가 없는 백엔드의 404·405만 미지원으로 본다', () => {
    expect(
      isExportUnsupported(new ApiError(404, 'RESOURCE_NOT_FOUND', 'x')),
    ).toBe(true);
    expect(
      isExportUnsupported(new ApiError(405, 'METHOD_NOT_ALLOWED', 'x')),
    ).toBe(true);
    expect(isExportUnsupported(new ApiError(404, 'USER_NOT_FOUND', 'x'))).toBe(
      false,
    );
    expect(isExportUnsupported(new ApiError(500, 'INTERNAL_ERROR', 'x'))).toBe(
      false,
    );
  });
});

describe('createMyDataApi', () => {
  it('내 정보 JSON 객체를 그대로 돌려준다', async () => {
    const data = { exportedAt: '2026-11-19T00:00:00Z', favorites: [] };
    server.use(http.get(EXPORT, () => HttpResponse.json(data)));

    await expect(api.fetchExport()).resolves.toEqual(data);
  });

  it('경로가 없으면 ApiError(404)로 실패해 미지원 안내를 고를 수 있다', async () => {
    server.use(
      http.get(EXPORT, () =>
        HttpResponse.json(
          { code: 'RESOURCE_NOT_FOUND', message: '없음', errors: [] },
          { status: 404 },
        ),
      ),
    );

    const error = await api.fetchExport().catch((cause: unknown) => cause);

    expect(isExportUnsupported(error)).toBe(true);
  });
});
