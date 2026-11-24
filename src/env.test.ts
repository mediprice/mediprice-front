import { describe, expect, it } from 'vitest';
import { z } from 'zod/mini';

import { envSchema } from './env';

function messageOf(schema: z.core.$ZodType, value: unknown) {
  const result = z.safeParse(schema, value);
  return result.success ? null : result.error.issues[0]?.message;
}

describe('envSchema 오류 문구', () => {
  it.each([
    [
      'BFF_SHARED_SECRET이 짧으면',
      envSchema.server.BFF_SHARED_SECRET,
      'short',
      'BFF_SHARED_SECRET must be at least 16 characters',
    ],
    [
      'API 주소가 URL이 아니면',
      envSchema.client.NEXT_PUBLIC_API_URL,
      'localhost',
      'NEXT_PUBLIC_API_URL must be an absolute URL',
    ],
    [
      '사이트 주소가 URL이 아니면',
      envSchema.client.NEXT_PUBLIC_SITE_URL,
      'mediprice',
      'NEXT_PUBLIC_SITE_URL must be an absolute URL',
    ],
    [
      'NODE_ENV가 다르면',
      envSchema.shared.NODE_ENV,
      'staging',
      'NODE_ENV must be development, test or production',
    ],
  ])('%s 무엇이 틀렸는지 알려 준다', (_, schema, value, message) => {
    expect(messageOf(schema, value)).toBe(message);
  });

  it('맞는 값은 통과한다', () => {
    expect(
      messageOf(envSchema.client.NEXT_PUBLIC_API_URL, 'http://api.test'),
    ).toBeNull();
  });
});
