import { z } from 'zod';

const npayCodeSchema = z.string().regex(/^[A-Za-z0-9]{1,20}$/);

/** URL의 item 파라미터. 배열이거나 형식이 맞지 않으면 선택하지 않은 것으로 본다. */
export function parseItemParam(value: unknown): string | null {
  const result = npayCodeSchema.safeParse(value);
  return result.success ? result.data : null;
}

/** Next가 이미 풀어 준 값이어도 ykiho(base64 문자)에는 %가 없어 한 번 더 풀어도 같다. */
export function decodeYkiho(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function buildNaverMapUrl(query: string) {
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}

/** 심평원 홈페이지 값은 scheme이 빠지거나 공백이 섞여 있어 http(s) URL로 고칠 수 있을 때만 링크로 쓴다. */
export function toHomepageUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes('.')) return null;
    return { href: url.href, label: url.hostname.replace(/^www\./, '') };
  } catch {
    return null;
  }
}

/** 전화번호에서 숫자와 +만 남겨 tel: 링크를 만든다. 숫자가 너무 적으면 링크를 만들지 않는다. */
export function toTelHref(phone: string | null | undefined) {
  const digits = phone?.replace(/[^\d+]/g, '') ?? '';
  return digits.replace(/\D/g, '').length >= 7 ? `tel:${digits}` : null;
}

const BACK_KEYS = new Set(['region', 'sggu', 'institution', 'sort']);
const BACK_VALUE = /^[A-Za-z0-9_-]{1,40}$/;

/** 항목 가격 화면(S-06)이 넘긴 검색 조건. 허용한 키와 안전한 값만 있을 때만 쿼리 문자열로 돌려준다. */
export function parseBackParam(value: unknown): string | null {
  if (typeof value !== 'string' || value === '' || value.length > 200) {
    return null;
  }
  const params = new URLSearchParams(value);
  const safe = new URLSearchParams();
  for (const [key, entry] of params) {
    if (!BACK_KEYS.has(key) || !BACK_VALUE.test(entry) || safe.has(key)) {
      return null;
    }
    safe.set(key, entry);
  }
  return safe.size > 0 ? safe.toString() : null;
}
