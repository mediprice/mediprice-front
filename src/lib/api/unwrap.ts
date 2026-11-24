import { ApiError, fromErrorBody, NetworkError } from './errors';

type FetchResult<T> = {
  data?: T;
  error?: unknown;
  response: Response;
};

/** 성공하면 데이터를, 실패하면 `ApiError`(서버 응답) 또는 `NetworkError`(연결 실패)를 던진다. 본문 없는 응답(204)은 `undefined`다. */
export async function unwrap<T>(request: Promise<FetchResult<T>>) {
  let result: FetchResult<T>;
  try {
    result = await request;
  } catch (cause) {
    throw cause instanceof ApiError ? cause : new NetworkError(cause);
  }
  /** openapi-fetch는 본문 없는 실패(Content-Length: 0)에 error를 비워 두므로 상태도 본다. */
  if (result.error !== undefined || !result.response.ok) {
    throw fromErrorBody(result.response.status, result.error);
  }
  /** 실패는 위에서 던졌으므로 성공 본문이다. 본문 없는 성공(204)은 생성 타입의 data가 이미 비어 있다. */
  return result.data as T;
}
