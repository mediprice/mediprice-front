import 'server-only';

/** 화면이 실제로 읽는 형식만 그대로 돌려준다. 그 밖(HTML·SVG 등)은 이 출처의 문서로 해석되지 않게 바꾼다. */
const RELAYABLE_TYPES = new Set([
  'application/json',
  'application/problem+json',
  'text/plain',
]);

export function relayedContentType(value: string | null) {
  if (!value) return null;
  const mediaType = value.split(';')[0]?.trim().toLowerCase() ?? '';
  return RELAYABLE_TYPES.has(mediaType) ? value : 'application/octet-stream';
}

export const RELAY_CSP = "default-src 'none'; frame-ancestors 'none'; sandbox";
