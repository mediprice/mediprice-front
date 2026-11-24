import 'server-only';

import type { ApiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/api/unwrap';

import { createPublicApi } from './public-client';

/** 백엔드가 한 페이지에 허용하는 최대 크기다. */
const PAGE_SIZE = 100;

/** 항목 목록은 심평원 고시가 바뀔 때만 달라지므로 하루 동안 캐시한다. 사이트맵의 revalidate와 같다. */
const sitemapApi = createPublicApi({ revalidate: 86_400, timeoutMs: 10_000 });

/** 사이트맵에 넣을 항목 코드. 첫 페이지로 전체 페이지 수를 알고 나머지를 함께 읽되 limit을 넘겨 읽지 않는다. */
export async function listItemCodes(
  limit: number,
  client: ApiClient = sitemapApi,
) {
  const readPage = (page: number) =>
    unwrap(
      client.GET('/api/npay-items', {
        params: {
          query: { condition: {}, pageQuery: { page, size: PAGE_SIZE } },
        },
      }),
    );
  const first = await readPage(0);
  const pageCount = Math.min(first.totalPages, Math.ceil(limit / PAGE_SIZE));
  const rest = await Promise.all(
    Array.from({ length: Math.max(pageCount - 1, 0) }, (_, index) =>
      readPage(index + 1),
    ),
  );
  const codes = [first, ...rest].flatMap((page) =>
    page.content.map((item) => item.code),
  );
  return [...new Set(codes)].slice(0, limit);
}
