import type { NextRequest } from 'next/server';

import { readTokens } from '@/server/bff/cookies';
import { refreshSessionOnce } from '@/server/bff/refresh-coalescer';
import { refreshResponse } from '@/server/bff/refresh-session';
import { forbidden, unauthenticated } from '@/server/bff/responses';
import { isSameOrigin } from '@/server/bff/upstream';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbidden();

  const result = await refreshSessionOnce(
    readTokens(request).refreshToken,
    request.headers,
  );
  return refreshResponse(result, unauthenticated);
}
