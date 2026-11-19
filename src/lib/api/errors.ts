import { z } from 'zod';

/** OpenAPI 스펙에 없는 형식이라 런타임에 검증한다. */
const errorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  errors: z
    .array(z.object({ field: z.string(), reason: z.string() }))
    .default([]),
});

export type FieldError = { field: string; reason: string };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: FieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('Network request failed', { cause });
    this.name = 'NetworkError';
  }
}

export function fromErrorBody(status: number, body: unknown): ApiError {
  const parsed = errorResponseSchema.safeParse(body);
  if (!parsed.success) {
    return new ApiError(status, 'UNKNOWN', 'Unrecognized error response');
  }
  const { code, message, errors } = parsed.data;
  return new ApiError(status, code, message, errors);
}

export async function toApiError(response: Response): Promise<ApiError> {
  return fromErrorBody(
    response.status,
    await response.json().catch(() => null),
  );
}

/** 배포된 백엔드에 아직 없는 경로는 일반 404(RESOURCE_NOT_FOUND)로 온다(docs 7.2.1). 도메인 404(REVIEW_NOT_FOUND 등)와 구분한다. */
export function isUnsupportedEndpoint(error: unknown) {
  return (
    error instanceof ApiError &&
    error.status === 404 &&
    (error.code === 'RESOURCE_NOT_FOUND' || error.code === 'NOT_FOUND')
  );
}
