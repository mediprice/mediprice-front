import { z } from 'zod';

/** 백엔드는 5곳까지 받지만 화면 폭(360px)에서 읽을 수 있는 열은 3개다. */
export const MAX_COMPARE = 3;

const ykihoSchema = z.string().regex(/^[A-Za-z0-9+/=_-]{1,200}$/);
const npayCodeSchema = z.string().regex(/^[A-Za-z0-9]{1,20}$/);

export function isYkiho(value: unknown): value is string {
  return ykihoSchema.safeParse(value).success;
}

export function isNpayCode(value: unknown): value is string {
  return npayCodeSchema.safeParse(value).success;
}

/** URL의 h 파라미터(여러 개). 형식이 틀린 값과 중복은 버리고 앞에서부터 3곳만 남긴다. */
export function parseYkihos(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];
  const unique = new Set(values.filter(isYkiho));
  return [...unique].slice(0, MAX_COMPARE);
}

/** URL의 item 파라미터. 배열이거나 형식이 맞지 않으면 항목 없이 비교한다. */
export function parseItemCode(value: unknown): string | null {
  return isNpayCode(value) ? value : null;
}

export function parseCompareParams(
  params: Record<string, string | string[] | undefined>,
) {
  return { ykihos: parseYkihos(params.h), item: parseItemCode(params.item) };
}

/** 비교 화면 주소가 비교 대상의 기준이라 그대로 공유할 수 있다(`/compare?h=A&h=B&item=CODE`). */
export function buildCompareHref(
  ykihos: readonly string[],
  item: string | null,
) {
  const query = new URLSearchParams();
  for (const ykiho of ykihos) query.append('h', ykiho);
  if (item) query.set('item', item);
  const search = query.toString();
  return search ? (`/compare?${search}` as const) : ('/compare' as const);
}
