const STORAGE_KEY = 'mp:returnTo';
const CALLBACK_PATH = '/oauth/callback';
const PLACEHOLDER_ORIGIN = 'http://return.invalid';
/** 백엔드 return_to 규칙과 같다. */
const MAX_LENGTH = 512;

/** 오픈 리다이렉트를 막기 위해 같은 출처의 상대 경로(`/…`, 512자 이하)만 받는다. 콜백 주소로 돌아가면 반복되므로 뺀다. */
export function sanitizeReturnPath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > MAX_LENGTH) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return null;

  let url: URL;
  try {
    url = new URL(value, PLACEHOLDER_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return null;
  if (url.pathname === CALLBACK_PATH) return null;
  return url.pathname + url.search;
}

function sessionStore() {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

/** 안전하지 않은 경로(콜백 화면에서 다시 시도할 때의 현재 경로 등)는 무시해 먼저 저장한 경로를 지킨다. */
export function saveReturnPath(path: string) {
  const safe = sanitizeReturnPath(path);
  const store = sessionStore();
  if (!safe || !store) return;
  try {
    store.setItem(STORAGE_KEY, safe);
  } catch {}
}

export function readReturnPath(): string | null {
  try {
    return sanitizeReturnPath(sessionStore()?.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

/** 저장한 경로를 읽고 지운다. 없거나 안전하지 않으면 `null`이다. */
export function consumeReturnPath(): string | null {
  const value = readReturnPath();
  try {
    sessionStore()?.removeItem(STORAGE_KEY);
  } catch {}
  return value;
}
