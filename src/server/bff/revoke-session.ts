import 'server-only';

import { env } from '@/env';

import { jsonHeaders } from './refresh-session';
import { callBackend } from './upstream';

/** 백엔드에 Refresh 폐기를 알린다. 실패해도 브라우저 쿠키는 지워야 하므로 결과를 보지 않는다. */
export async function revokeSession(refreshToken: string, incoming: Headers) {
  await callBackend(new URL('/api/auth/logout', env.NEXT_PUBLIC_API_URL), {
    method: 'POST',
    headers: jsonHeaders(incoming),
    body: JSON.stringify({ refreshToken }),
  });
}
