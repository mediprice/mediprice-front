import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { API, server } from '@/test/server';

import { listItemCodes } from './item-codes';
import { createPublicApi } from './public-client';

const api = createPublicApi({ revalidate: 0 });

function useItemPages(totalPages: number, perPage = 100) {
  const requested: number[] = [];
  server.use(
    http.get(`${API}/api/npay-items`, ({ request }) => {
      const page = Number(new URL(request.url).searchParams.get('page'));
      requested.push(page);
      return HttpResponse.json({
        content: Array.from({ length: perPage }, (_, index) => ({
          code: `C${page}x${index}`,
          name: '항목',
          mdivCode: null,
          mdivName: null,
          sdivCode: null,
          sdivName: null,
        })),
        page,
        size: perPage,
        totalElements: totalPages * perPage,
        totalPages,
      });
    }),
  );
  return requested;
}

describe('listItemCodes', () => {
  it('모든 페이지를 읽어 코드를 모은다', async () => {
    const requested = useItemPages(3);

    const codes = await listItemCodes(5_000, api);

    expect(codes).toHaveLength(300);
    expect(requested.toSorted()).toEqual([0, 1, 2]);
  });

  it('한도를 넘는 페이지는 읽지 않는다', async () => {
    const requested = useItemPages(60);

    const codes = await listItemCodes(250, api);

    expect(codes).toHaveLength(250);
    expect(requested.toSorted()).toEqual([0, 1, 2]);
  });

  it('백엔드가 실패하면 예외로 알린다(사이트맵이 인기 항목으로 대신한다)', async () => {
    server.use(
      http.get(`${API}/api/npay-items`, () =>
        HttpResponse.json(
          { code: 'UPSTREAM_UNAVAILABLE', message: '', errors: [] },
          { status: 503 },
        ),
      ),
    );

    await expect(listItemCodes(100, api)).rejects.toMatchObject({
      status: 503,
    });
  });
});
