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
  if (result.error !== undefined) {
    throw fromErrorBody(result.response.status, result.error);
  }
  return result.data as T;
}
