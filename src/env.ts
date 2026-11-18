import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/** @public Validated env; import this instead of reading process.env directly. */
export const env = createEnv({
  shared: {
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
  },
  server: {
    /** 백엔드가 BFF를 믿고 사용자 IP 헤더를 받아들일 때 쓰는 공유 비밀값. 없으면 IP를 전달하지 않는다. */
    BFF_SHARED_SECRET: z.string().min(16).optional(),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.url(),
    /** 네이버 지도(NCP Maps) Client ID. 없으면 지도 탐색 화면이 지도 없이 목록만 보여 준다. */
    NEXT_PUBLIC_NAVER_MAP_CLIENT_ID: z.string().min(1).optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_NAVER_MAP_CLIENT_ID:
      process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID,
    BFF_SHARED_SECRET: process.env.BFF_SHARED_SECRET,
  },
  // Set SKIP_ENV_VALIDATION=1 for builds that run without real env values (e.g. Docker, CI lint).
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
