import { z } from 'zod/mini';

const KEY = 'mediprice:pending-location';
/** 로그인 창을 닫고 한참 뒤 돌아왔을 때 위치를 잘못 읽지 않게, 짧은 시간 안에 돌아왔을 때만 이어서 한다. */
const MAX_AGE_MS = 15 * 60 * 1000;

const pendingSchema = z.object({
  path: z.string().check(z.startsWith('/'), z.maxLength(2000)),
  savedAt: z.number(),
});

/** 로그인하지 않은 채 현재 위치를 누르면 로그인 뒤 같은 화면에서 이어 하려고 남긴다(이 탭에만). */
export function savePendingLocation(path: string, now = Date.now()) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ path, savedAt: now }));
  } catch {
    /** 저장소를 쓸 수 없으면 이어 하지 않는다. */
  }
}

/** 지금 화면이 남긴 화면과 같고 오래되지 않았으면 true. 꺼내는 즉시 지워서 한 번만 쓴다. */
export function takePendingLocation(currentPath: string, now = Date.now()) {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return false;
    window.sessionStorage.removeItem(KEY);
    const parsed = pendingSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return false;
    return (
      parsed.data.path === currentPath &&
      now - parsed.data.savedAt <= MAX_AGE_MS
    );
  } catch {
    return false;
  }
}
