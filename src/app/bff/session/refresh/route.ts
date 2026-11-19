import type { NextRequest } from 'next/server';

import { readTokens } from '@/server/bff/cookies';
import { refreshResponse, refreshSession } from '@/server/bff/refresh-session';
import { forbidden, unauthenticated } from '@/server/bff/responses';
import { isSameOrigin } from '@/server/bff/upstream';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbidden();

  const result = await refreshSession(readTokens(request).refreshToken);
  return refreshResponse(result, unauthenticated);
}
