import 'server-only';

import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { env } from '@/env';
import { ANONYMOUS_REQUEST_HEADER } from '@/lib/api/paths';

import { gatewayTimeout, unavailable } from './responses';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** `/bff/api/**`를 백엔드의 `/api/` 아래로만 변환한다. 경로를 벗어나려는 시도는 `null`로 거부한다. */
export function resolveBackendUrl(segments: string[], search: string) {
  const [root, ...rest] = segments;
  if (root !== 'api' || rest.length === 0 || !rest.every(isSafeSegment)) {
    return null;
  }

  const url = new URL(env.NEXT_PUBLIC_API_URL);
  url.pathname = `/${segments.map(encodeURIComponent).join('/')}`;
  url.search = search;
  return url;
}

/** 이미 디코딩된 값이므로 `%`가 남아 있으면 이중 인코딩이다. */
function isSafeSegment(segment: string) {
  return (
    segment !== '' &&
    segment !== '.' &&
    segment !== '..' &&
    !/[/\\%]/.test(segment)
  );
}

/** 상태를 바꾸는 요청은 우리 페이지에서 보낸 것만 받는다(CSRF 방어). */
export function isSameOrigin(request: NextRequest) {
  if (SAFE_METHODS.has(request.method)) return true;

  const origin = request.headers.get('origin');
  if (!origin) return false;
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

const CLIENT_IP_HEADER = 'x-mediprice-client-ip';
const SECRET_HEADER = 'x-mediprice-bff-secret';

/** 플랫폼(Vercel 등)이 붙인 사용자 IP. 형식이 IP가 아니면 버린다. */
function clientIpOf(incoming: Headers) {
  const candidate =
    incoming.get('x-real-ip') ??
    incoming.get('x-forwarded-for')?.split(',')[0] ??
    '';
  const ip = candidate.trim();
  return z.union([z.ipv4(), z.ipv6()]).safeParse(ip).success ? ip : null;
}

/** 브라우저가 계정 없이 보내 달라고 한 공개 조회(주변 병원 등). 로그인 쿠키가 있어도 Access를 붙이지 않는다. */
export function isAnonymousRequest(incoming: Headers) {
  return incoming.get(ANONYMOUS_REQUEST_HEADER) === '1';
}

/** 백엔드로 보낼 헤더. 브라우저의 Cookie·Authorization은 버리고 쿠키의 Access로 Authorization을 만든다. User-Agent는 백엔드가 동의 기록의 근거로 남긴다. 공유 비밀값이 있으면 사용자 IP를 함께 보낸다(AI 비회원 한도용). */
export function forwardHeaders(
  incoming: Headers,
  accessToken?: string,
  sharedSecret: string | undefined = env.BFF_SHARED_SECRET,
) {
  const headers = new Headers();
  for (const name of ['content-type', 'accept', 'user-agent']) {
    const value = incoming.get(name);
    if (value) headers.set(name, value);
  }
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);

  const clientIp = clientIpOf(incoming);
  if (sharedSecret && clientIp) {
    headers.set(SECRET_HEADER, sharedSecret);
    headers.set(CLIENT_IP_HEADER, clientIp);
  }
  return headers;
}

/** 플랫폼 함수 제한보다 먼저 끊어 AI 응답처럼 긴 호출도 우리 에러 본문으로 끝나게 한다. 본문 전송까지 포함한 시간이다. */
const UPSTREAM_TIMEOUT_MS = 35_000;

function isTimeout(error: unknown) {
  return error instanceof Error && error.name === 'TimeoutError';
}

/** 연결 실패는 502, 제한 시간 초과는 504 응답으로 바꾼다. */
export async function callBackend(url: URL, init: RequestInit) {
  try {
    return await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    return isTimeout(error) ? gatewayTimeout() : unavailable();
  }
}
