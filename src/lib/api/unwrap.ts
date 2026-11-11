import { ApiError, fromErrorBody, NetworkError } from './errors';

type FetchResult<T> = {
  data?: T;
  error?: unknown;
  response: Response;
};

/**
 * openapi-fetch의 `{data, error, response}` 결과를 풀어, 성공하면 데이터를 돌려주고 실패하면 예외를 던진다.
 * TanStack Query의 `queryFn`은 예외를 던져야 오류 상태가 되므로 쿼리에서는 항상 이 함수를 거친다.
 *
 * - 서버가 실패로 응답: `ApiError` (`code`로 분기, 검증 실패는 `fieldErrors`)
 * - 서버에 닿지 못함: `NetworkError`
 */
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
