type DetailQuery<T> = {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  /** 공개 데이터에 없는 코드(404)로 실패했는지. */
  isMissing: boolean;
};

type ResultState<I, T> =
  | { kind: 'list'; entries: { item: I; detail: T }[]; pendingCount: number }
  | { kind: 'missing' }
  | { kind: 'loadError' };

/** AI가 고른 코드 중 공개 데이터에 없는 것은 빼고, 하나도 남지 않으면 모두 없는 코드였는지(찾지 못함) 불러오기 실패인지 가른다. */
export function resolveResultState<I, T>(
  items: readonly I[],
  queries: readonly DetailQuery<T>[],
): ResultState<I, T> {
  const entries = items.flatMap((item, index) => {
    const detail = queries[index]?.data;
    return detail ? [{ item, detail }] : [];
  });
  const pendingCount = queries.filter((query) => query.isPending).length;
  if (entries.length > 0 || pendingCount > 0) {
    return { kind: 'list', entries, pendingCount };
  }
  const failed = queries.filter((query) => query.isError);
  return failed.every((query) => query.isMissing)
    ? { kind: 'missing' }
    : { kind: 'loadError' };
}
