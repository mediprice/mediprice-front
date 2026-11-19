import { describe, expect, it } from 'vitest';

import { ApiError, NetworkError } from './api/errors';
import { shouldRetryQuery } from './query-client';

describe('shouldRetryQuery', () => {
  it.each([400, 401, 403, 404, 409])(
    '%i 응답은 재시도하지 않는다',
    (status) => {
      expect(shouldRetryQuery(0, new ApiError(status, 'X', ''))).toBe(false);
    },
  );

  it('5xx 응답은 세 번까지 재시도한다', () => {
    const error = new ApiError(502, 'UPSTREAM_UNAVAILABLE', '');
    expect(shouldRetryQuery(2, error)).toBe(true);
    expect(shouldRetryQuery(3, error)).toBe(false);
  });

  it('네트워크 오류는 재시도한다', () => {
    expect(shouldRetryQuery(0, new NetworkError(null))).toBe(true);
  });
});
