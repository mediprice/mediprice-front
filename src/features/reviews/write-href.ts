import { z } from 'zod';

export type ReviewWriteFrom = 'hospital' | 'my';

/** 후기 작성·수정 화면 주소. 수정이면 후기 번호와 돌아갈 화면을 쿼리로 넘긴다. */
export function reviewWriteHref(
  ykiho: string,
  options: { edit?: number; from?: ReviewWriteFrom } = {},
) {
  const params = new URLSearchParams();
  if (options.edit != null) params.set('edit', String(options.edit));
  if (options.from === 'my') params.set('from', 'my');
  const path = `/hospitals/${encodeURIComponent(ykiho)}/review` as const;
  return params.size > 0 ? (`${path}?${params.toString()}` as const) : path;
}

const reviewIdSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);

/** URL의 edit 파라미터. 배열이거나 양의 정수가 아니면 새 후기 작성으로 본다. */
export function parseEditParam(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d{1,16}$/.test(value)) return null;
  const result = reviewIdSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function parseFromParam(value: unknown): ReviewWriteFrom {
  return value === 'my' ? 'my' : 'hospital';
}
