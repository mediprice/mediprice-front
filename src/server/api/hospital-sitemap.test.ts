import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { API, server } from '@/test/server';

import { listHospitalEntries } from './hospital-sitemap';

const plainFetch = (url: URL) => fetch(url);

function useHospitalPages(totalPages: number, perPage = 3) {
  const requested: number[] = [];
  server.use(
    http.get(`${API}/api/hospitals/sitemap`, ({ request }) => {
      const page = Number(new URL(request.url).searchParams.get('page'));
      requested.push(page);
      return HttpResponse.json({
        content: Array.from({ length: perPage }, (_, index) => ({
          ykiho: `Y${page}x${index}`,
          lastModified: index === 0 ? null : '2026-09-03',
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

describe('listHospitalEntries', () => {
  it('모든 페이지를 읽어 병원을 모은다', async () => {
    const requested = useHospitalPages(3);

    const entries = await listHospitalEntries(40_000, plainFetch);

    expect(requested.sort()).toEqual([0, 1, 2]);
    expect(entries).toHaveLength(9);
    expect(entries[0]).toEqual({ ykiho: 'Y0x0', lastModified: null });
    expect(entries[1]).toEqual({ ykiho: 'Y0x1', lastModified: '2026-09-03' });
  });

  it('limit을 넘는 페이지는 읽지 않는다', async () => {
    const requested = useHospitalPages(20);

    const entries = await listHospitalEntries(6_000, plainFetch);

    expect(requested.sort()).toEqual([0, 1]);
    expect(entries).toHaveLength(6);
  });

  it('백엔드에 목록 API가 없으면(404) 던진다', async () => {
    server.use(
      http.get(
        `${API}/api/hospitals/sitemap`,
        () => new HttpResponse(null, { status: 404 }),
      ),
    );

    await expect(listHospitalEntries(10, plainFetch)).rejects.toThrow();
  });
});
