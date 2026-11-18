import { describe, expect, it } from 'vitest';

import ko from '@/i18n/messages/ko.json';

import { errorMessageKey } from './error-message';
import { ApiError, NetworkError } from './errors';

describe('errorMessageKey', () => {
  it.each([
    ['INVALID_INPUT', 400, 'invalidInput'],
    ['EXPIRED_REFRESH_TOKEN', 401, 'sessionExpired'],
    ['REVIEW_FORBIDDEN', 403, 'forbidden'],
    ['HOSPITAL_NOT_FOUND', 404, 'hospitalNotFound'],
    ['REVIEW_ALREADY_REPORTED', 409, 'reviewAlreadyReported'],
    ['UPSTREAM_UNAVAILABLE', 502, 'serverUnavailable'],
  ])('알려진 코드 %s는 해당 문구 키로 바꾼다', (code, status, key) => {
    expect(errorMessageKey(new ApiError(status, code, 'ignored'))).toBe(key);
  });

  it.each([
    [400, 'badRequest'],
    [401, 'loginRequired'],
    [403, 'forbidden'],
    [404, 'notFound'],
    [409, 'conflict'],
    [415, 'badRequest'],
    [429, 'tooManyRequests'],
    [500, 'server'],
    [503, 'server'],
    [418, 'unknown'],
  ])('모르는 코드는 상태 %i로 문구 키를 고른다', (status, key) => {
    expect(errorMessageKey(new ApiError(status, 'UNKNOWN', 'ignored'))).toBe(
      key,
    );
  });

  it('네트워크 오류는 연결 확인 문구 키로 바꾼다', () => {
    expect(errorMessageKey(new NetworkError(new TypeError('x')))).toBe(
      'network',
    );
  });

  it('OAuth 콜백 에러 코드 문자열도 바꾼다', () => {
    expect(errorMessageKey('MISSING_TOKENS')).toBe('loginFailed');
  });

  it.each([
    ['일반 Error', new Error('x')],
    ['모르는 문자열', 'SOMETHING_ELSE'],
    ['프로토타입 속성 이름', 'toString'],
    ['undefined', undefined],
  ])('%s는 알 수 없는 오류 키로 바꾼다', (_name, error) => {
    expect(errorMessageKey(error)).toBe('unknown');
  });

  it('돌려주는 모든 키가 ko.json에 있다', () => {
    const keys = [
      ...['INVALID_INPUT', 'UNAUTHORIZED', 'INTERNAL_ERROR'].map((code) =>
        errorMessageKey(new ApiError(500, code, '')),
      ),
      errorMessageKey(new ApiError(429, 'X', '')),
      errorMessageKey(new NetworkError(null)),
      errorMessageKey(null),
    ];
    for (const key of keys) expect(ko.errors).toHaveProperty(key);
  });
});
