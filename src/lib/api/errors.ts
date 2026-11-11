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
    super('네트워크 오류가 발생했습니다.', { cause });
    this.name = 'NetworkError';
  }
}

export function fromErrorBody(status: number, body: unknown): ApiError {
  const parsed = errorResponseSchema.safeParse(body);
  if (!parsed.success) {
    return new ApiError(status, 'UNKNOWN', '알 수 없는 오류가 발생했습니다.');
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
