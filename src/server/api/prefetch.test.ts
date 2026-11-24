import { describe, expect, it } from 'vitest';

import { ApiError, NetworkError } from '@/lib/api/errors';

import { isMissing, loadOrNotFound } from './prefetch';

const NOT_FOUND_DIGEST = 'NEXT_HTTP_ERROR_FALLBACK;404';

describe('isMissing', () => {
  it.each([
    ['항목 없음(404)', new ApiError(404, 'NPAY_ITEM_NOT_FOUND', ''), true],
    ['병원 없음(404)', new ApiError(404, 'HOSPITAL_NOT_FOUND', ''), true],
    ['잘못된 경로(404)', new ApiError(404, 'NOT_FOUND', ''), true],
    ['백엔드 장애(503)', new ApiError(503, 'UPSTREAM_UNAVAILABLE', ''), false],
    ['입력 오류(400)', new ApiError(400, 'INVALID_INPUT', ''), false],
    ['연결 실패', new NetworkError(new Error('down')), false],
  ])('%s → %s', (_name, error, expected) => {
    expect(isMissing(error)).toBe(expected);
  });
});

describe('loadOrNotFound', () => {
  it('성공하면 값을 돌려준다', async () => {
    await expect(
      loadOrNotFound(async () => ({ name: '도수치료' })),
    ).resolves.toEqual({
      name: '도수치료',
    });
  });

  it('백엔드가 없다고 답하면 404 페이지로 보낸다', async () => {
    const promise = loadOrNotFound(async () => {
      throw new ApiError(404, 'HOSPITAL_NOT_FOUND', '');
    });
    await expect(promise).rejects.toMatchObject({ digest: NOT_FOUND_DIGEST });
  });

  it.each([
    ['백엔드 장애', new ApiError(503, 'UPSTREAM_UNAVAILABLE', '')],
    ['연결 실패·시간 초과', new NetworkError(new Error('timeout'))],
  ])(
    '%s는 404가 아니라 null이라 브라우저가 다시 읽는다',
    async (_name, error) => {
      await expect(
        loadOrNotFound(async () => {
          throw error;
        }),
      ).resolves.toBeNull();
    },
  );
});
