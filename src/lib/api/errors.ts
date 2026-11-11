import { z } from 'zod';

/** 백엔드의 공통 에러 응답. OpenAPI 스펙에 없는 형식이라 런타임에 검증한다. */
const errorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  errors: z
    .array(z.object({ field: z.string(), reason: z.string() }))
    .default([]),
});

export type FieldError = { field: string; reason: string };

/** 서버가 응답한 실패. `code`로 분기하고, 입력 검증 실패는 `fieldErrors`로 폼에 연결한다. */
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

/** 서버에 닿지 못한 실패(연결 끊김, 오프라인). 서버의 응답이 아니므로 `ApiError`와 구분한다. */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('네트워크 오류가 발생했습니다.', { cause });
    this.name = 'NetworkError';
  }
}

/** 이미 읽은 에러 본문을 `ApiError`로 바꾼다. 본문이 약속된 형식이 아니면 code는 `UNKNOWN`이다. */
export function fromErrorBody(status: number, body: unknown): ApiError {
  const parsed = errorResponseSchema.safeParse(body);
  if (!parsed.success) {
    return new ApiError(status, 'UNKNOWN', '알 수 없는 오류가 발생했습니다.');
  }
  const { code, message, errors } = parsed.data;
  return new ApiError(status, code, message, errors);
}

/** 아직 본문을 읽지 않은 실패 응답을 `ApiError`로 바꾼다. */
export async function toApiError(response: Response): Promise<ApiError> {
  return fromErrorBody(
    response.status,
    await response.json().catch(() => null),
  );
}
