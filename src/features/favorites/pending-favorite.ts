import { z } from 'zod/mini';

import { readJson, removeItem, writeJson } from '@/lib/safe-storage';

const KEY = 'mediprice:pending-favorite';
/** 로그인 창을 닫고 한참 뒤 다른 길로 로그인했을 때 엉뚱하게 추가되지 않게, 짧은 시간 안에 돌아왔을 때만 이어서 한다. */
const MAX_AGE_MS = 15 * 60 * 1000;

const pendingSchema = z.object({
  ykiho: z.string().check(z.minLength(1), z.maxLength(200)),
  name: z.nullable(z.string().check(z.maxLength(200))),
  path: z.string().check(z.startsWith('/'), z.maxLength(2000)),
  scrollY: z.number().check(z.minimum(0)),
  savedAt: z.number(),
});

export type PendingFavorite = z.infer<typeof pendingSchema>;

/** 로그인하지 않은 채 관심을 누르면 로그인 뒤 같은 화면에서 이어 하려고 남긴다(이 탭에만). */
export function savePendingFavorite(
  value: Omit<PendingFavorite, 'savedAt'>,
  now = Date.now(),
) {
  writeJson('session', KEY, { ...value, savedAt: now });
}

/** 지금 화면이 남긴 화면과 같고 오래되지 않았으면 꺼내고 지운다. 아니면 지우기만 한다(한 번만 쓴다). */
export function takePendingFavorite(
  currentPath: string,
  now = Date.now(),
): PendingFavorite | null {
  const pending = readJson('session', KEY, pendingSchema);
  removeItem('session', KEY);
  return pending?.path === currentPath && now - pending.savedAt <= MAX_AGE_MS
    ? pending
    : null;
}
