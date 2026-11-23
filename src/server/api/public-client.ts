import 'server-only';

import createClient from 'openapi-fetch';

import { env } from '@/env';
import type { ApiClient } from '@/lib/api/client';
import { serializeQuery } from '@/lib/api/query';
import type { paths } from '@/lib/api/schema';

/** 병원·항목 상세처럼 자주 바뀌지 않는 공개 조회를 Next 데이터 캐시에 두는 시간(초). */
const DETAIL_REVALIDATE_SECONDS = 300;

/** 서버 렌더가 백엔드를 오래 기다리지 않게 끊는다. 실패하면 브라우저가 다시 읽는다. */
const PUBLIC_TIMEOUT_MS = 5_000;

/**
 * 쿠키·Authorization 없이 백엔드를 바로 부르는 서버 전용 클라이언트. 익명 호출이라 최근 본 기록이 남지 않아
 * 사용자와 상관없이 같은 답을 캐시해도 된다(BFF가 상세에 no-store를 쓰는 이유는 로그인 사용자의 기록이다).
 */
export function createPublicApi({
  revalidate,
  timeoutMs = PUBLIC_TIMEOUT_MS,
}: {
  revalidate: number;
  timeoutMs?: number;
}): ApiClient {
  return createClient<paths>({
    baseUrl: new URL(env.NEXT_PUBLIC_API_URL).origin,
    querySerializer: serializeQuery,
    headers: { accept: 'application/json' },
    fetch: (request) =>
      fetch(request, {
        signal: AbortSignal.timeout(timeoutMs),
        next: { revalidate },
      }),
  });
}

export const publicApi = createPublicApi({
  revalidate: DETAIL_REVALIDATE_SECONDS,
});
