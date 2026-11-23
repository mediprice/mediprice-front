import { z } from 'zod';

const VIEW_KEY = 'mpMapView';

const savedViewSchema = z.object({
  view: z.enum(['list', 'map']),
  selectedId: z.string().nullable().catch(null),
});

export type SavedView = z.infer<typeof savedViewSchema>;

const historyStateSchema = z.object({ [VIEW_KEY]: savedViewSchema });

/** history.state에서 지도 화면이 남긴 보기·선택을 읽는다. 없거나 모양이 다르면 null. */
export function parseSavedView(state: unknown): SavedView | null {
  const result = historyStateSchema.safeParse(state);
  return result.success ? result.data[VIEW_KEY] : null;
}

/** 다른 기록 값(Next 내부 상태 등)은 그대로 두고 지도 화면 칸만 바꾼다. */
export function withSavedView(state: unknown, value: SavedView) {
  const base = typeof state === 'object' && state !== null ? state : {};
  return { ...base, [VIEW_KEY]: value };
}

export function savedViewKey(state: unknown) {
  const saved = parseSavedView(state);
  return saved ? JSON.stringify(saved) : '';
}

export function parseSavedViewKey(key: string): SavedView | null {
  if (!key) return null;
  const result = savedViewSchema.safeParse(JSON.parse(key));
  return result.success ? result.data : null;
}
