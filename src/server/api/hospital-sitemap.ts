import 'server-only';

import { z } from 'zod';

import { env } from '@/env';

/** 백엔드가 한 번에 허용하는 최대 크기다. */
const PAGE_SIZE = 5_000;

/** 백엔드 feature/public-stats의 사이트맵 병원 목록. 배포 후 `pnpm api:generate`를 돌리면 생성 타입으로 바꾼다. */
const pageSchema = z.object({
  content: z.array(
    z.object({
      ykiho: z.string().regex(/^[A-Za-z0-9+/=_-]{1,200}$/),
      lastModified: z.iso.date().nullable(),
    }),
  ),
  totalPages: z.number().int().nonnegative(),
});

export type HospitalSitemapEntry = z.infer<
  typeof pageSchema
>['content'][number];

type Fetcher = (url: URL) => Promise<Response>;

const sitemapFetch: Fetcher = (url) =>
  fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
    next: { revalidate: 86_400 },
  });

async function readPage(page: number, fetcher: Fetcher) {
  const url = new URL('/api/hospitals/sitemap', env.NEXT_PUBLIC_API_URL);
  url.search = new URLSearchParams({
    page: String(page),
    size: String(PAGE_SIZE),
  }).toString();
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`hospital sitemap ${response.status}`);
  return pageSchema.parse(await response.json());
}

/** 가격이 있는 병원(ykiho 순)을 limit까지 읽는다. 첫 페이지로 전체 페이지 수를 알고 나머지를 함께 읽는다. 실패하면 던진다. */
export async function listHospitalEntries(
  limit: number,
  fetcher: Fetcher = sitemapFetch,
) {
  const first = await readPage(0, fetcher);
  const pageCount = Math.min(first.totalPages, Math.ceil(limit / PAGE_SIZE));
  const rest = await Promise.all(
    Array.from({ length: Math.max(pageCount - 1, 0) }, (_, index) =>
      readPage(index + 1, fetcher),
    ),
  );
  return [first, ...rest].flatMap((page) => page.content).slice(0, limit);
}
