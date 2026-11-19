import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

import { resolveSiteUrl } from './config/site-url';

/** 클라이언트에도 인라인되는 값이라 서버·브라우저가 같은 결과를 내도록 NODE_ENV만 본다(Vercel 미리보기 빌드 포함). */
const isProductionBuild = process.env.NODE_ENV === 'production';
/** 서버 전용 값은 실제 운영 배포(Vercel production)에서만 강제한다. 로컬 `next build`와 미리보기는 비워 둘 수 있다. */
const isProductionDeploy = process.env.VERCEL_ENV === 'production';

const DEV_SITE_URL = 'http://localhost:3000';

/** @public Validated env; import this instead of reading process.env directly. */
export const env = createEnv({
  shared: {
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
  },
  server: {
    /** 백엔드가 BFF를 믿고 사용자 IP 헤더를 받아들일 때 쓰는 공유 비밀값. 운영 배포에서는 필수다. */
    BFF_SHARED_SECRET: z
      .string()
      .min(16)
      .optional()
      .refine((value) => !isProductionDeploy || value !== undefined, {
        message: 'BFF_SHARED_SECRET is required in production',
      }),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.url(),
    /** canonical·OG·sitemap의 절대 주소 기준(origin). 운영 빌드에서는 필수(Vercel 미리보기는 브랜치 주소)이고 개발에서는 localhost:3000이다. */
    NEXT_PUBLIC_SITE_URL: z
      .url()
      .optional()
      .refine((value) => !isProductionBuild || value !== undefined, {
        message: 'NEXT_PUBLIC_SITE_URL is required in production builds',
      })
      .transform((value) => new URL(value ?? DEV_SITE_URL).origin),
    /** 네이버 지도(NCP Maps) Client ID. 없으면 지도 탐색 화면이 지도 없이 목록만 보여 준다. */
    NEXT_PUBLIC_NAVER_MAP_CLIENT_ID: z.string().min(1).optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: resolveSiteUrl({
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    }),
    NEXT_PUBLIC_NAVER_MAP_CLIENT_ID:
      process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID,
    BFF_SHARED_SECRET: process.env.BFF_SHARED_SECRET,
  },
  // Set SKIP_ENV_VALIDATION=1 for builds that run without real env values (e.g. Docker, CI lint).
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
