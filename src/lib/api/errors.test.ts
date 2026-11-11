import { describe, expect, it } from 'vitest';

import { ApiError, NetworkError, toApiError } from './errors';

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('toApiError', () => {
  it('백엔드 에러 본문을 ApiError로 바꾼다', async () => {
    const error = await toApiError(
      json(404, {
        code: 'HOSPITAL_NOT_FOUND',
        message: '병원 없음',
        errors: [],
      }),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.code).toBe('HOSPITAL_NOT_FOUND');
    expect(error.message).toBe('병원 없음');
    expect(error.fieldErrors).toEqual([]);
  });

  it('입력 검증 실패의 필드 에러를 보존한다', async () => {
    const error = await toApiError(
      json(400, {
        code: 'INVALID_INPUT',
        message: '잘못된 요청입니다.',
        errors: [{ field: 'keyword', reason: '공백일 수 없습니다' }],
      }),
    );

    expect(error.fieldErrors).toEqual([
      { field: 'keyword', reason: '공백일 수 없습니다' },
    ]);
  });

  it('errors가 없는 본문도 받아들인다', async () => {
    const error = await toApiError(
      json(401, { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' }),
    );

    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.fieldErrors).toEqual([]);
  });

  it.each([
    ['본문 없음', new Response(null, { status: 500 })],
    ['HTML', new Response('<html>oops</html>', { status: 502 })],
    ['깨진 JSON', new Response('{not json', { status: 500 })],
    ['다른 JSON 형식', json(500, { error: 'x' })],
  ])('형식이 맞지 않으면(%s) UNKNOWN으로 바꾼다', async (_name, response) => {
    const error = await toApiError(response);

    expect(error.code).toBe('UNKNOWN');
    expect(error.status).toBe(response.status);
    expect(error.fieldErrors).toEqual([]);
  });
});

describe('NetworkError', () => {
  it('원인을 보존한다', () => {
    const cause = new TypeError('fetch failed');
    const error = new NetworkError(cause);

    expect(error).toBeInstanceOf(Error);
    expect(error.cause).toBe(cause);
  });
});
