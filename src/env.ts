import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/** @public Validated env; import this instead of reading process.env directly. */
export const env = createEnv({
  shared: {
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
  },
  server: {},
  client: {
    NEXT_PUBLIC_API_URL: z.url().optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // Set SKIP_ENV_VALIDATION=1 for builds that run without real env values (e.g. Docker, CI lint).
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
