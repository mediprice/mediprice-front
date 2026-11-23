import 'server-only';

import { z } from 'zod';

import { env } from '@/env';

/** 홈 통계·인기 순위는 백엔드가 10분 캐시한다. 같은 주기로 다시 읽는다. */
export const HOME_REVALIDATE_SECONDS = 600;
const HOME_TIMEOUT_MS = 5_000;

/** 백엔드 feature/public-stats의 StatsResponse. 배포 후 `pnpm api:generate`를 돌리면 생성 타입과 publicApi로 바꾼다. */
const siteStatsSchema = z.object({
  hospitalCount: z.number().int().nonnegative(),
  npayItemCount: z.number().int().nonnegative(),
  priceCount: z.number().int().nonnegative(),
  dataDate: z.iso.date().nullable(),
});

const popularItemsSchema = z.array(
  z.object({
    rank: z.number().int().positive(),
    npayCode: z.string().regex(/^[A-Za-z0-9]{1,20}$/),
    name: z.string().trim().min(1),
  }),
);

export type SiteStats = z.infer<typeof siteStatsSchema>;

/** 아직 배포되지 않았거나(404) 장애면 null이다. 홈은 이 값 없이도 그려진다. */
async function readPublic<T>(path: string, schema: z.ZodType<T>) {
  try {
    const response = await fetch(new URL(path, env.NEXT_PUBLIC_API_URL), {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(HOME_TIMEOUT_MS),
      next: { revalidate: HOME_REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;
    const parsed = schema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** 가격이 있는 병원·항목 수, 가격 건수, 데이터 기준일. */
export function fetchSiteStats() {
  return readPublic('/api/stats', siteStatsSchema);
}

/** 최근 30일 로그인 이용자가 많이 본 항목(5명 미만이 본 항목은 백엔드가 뺀다). 모자라면 빈 배열이다. */
export async function fetchPopularItems(limit: number) {
  const items = await readPublic(
    `/api/npay-items/popular?limit=${limit}`,
    popularItemsSchema,
  );
  return items ?? [];
}
