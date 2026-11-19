import { describe, expect, it, vi } from 'vitest';

import {
  createPriceCursor,
  type HospitalPrice,
  pullMergedPrices,
} from './price-stream';

function row(ykiho: string, price: number): HospitalPrice {
  return {
    ykiho,
    hospitalName: ykiho,
    className: '병원',
    sidoName: null,
    sgguName: null,
    address: null,
    itemName: null,
    price,
    startDate: null,
  };
}

/** 정렬된 행 배열을 size씩 잘라 주는 가짜 백엔드 */
function backend(streams: Record<string, HospitalPrice[]>, size = 2) {
  const fetchPage = vi.fn(async (condition: string, page: number) => {
    const all = streams[condition] ?? [];
    return {
      content: all.slice(page * size, page * size + size),
      page,
      size,
      totalElements: all.length,
      totalPages: Math.ceil(all.length / size),
    };
  });
  return fetchPage;
}

const prices = (rows: HospitalPrice[]) => rows.map((r) => r.price);

describe('pullMergedPrices', () => {
  it('두 목록을 가격 낮은 순으로 합친다', async () => {
    const fetchPage = backend({
      seoul: [row('a', 1000), row('b', 3000), row('c', 5000)],
      gyeonggi: [row('x', 2000), row('y', 4000)],
    });

    const { rows, next } = await pullMergedPrices({
      cursor: createPriceCursor(['seoul', 'gyeonggi']),
      sort: 'price_asc',
      fetchPage,
      minNewHospitals: 10,
      maxRows: 100,
    });

    expect(prices(rows)).toEqual([1000, 2000, 3000, 4000, 5000]);
    expect(next).toBeUndefined();
  });

  it('가격 높은 순도 앞에서부터 큰 값을 고른다', async () => {
    const fetchPage = backend({
      seoul: [row('a', 9000), row('b', 3000)],
      gyeonggi: [row('x', 7000), row('y', 5000)],
    });

    const { rows } = await pullMergedPrices({
      cursor: createPriceCursor(['seoul', 'gyeonggi']),
      sort: 'price_desc',
      fetchPage,
      minNewHospitals: 10,
      maxRows: 100,
    });

    expect(prices(rows)).toEqual([9000, 7000, 5000, 3000]);
  });

  it('새 병원 수를 채우면 멈추고, 다음 커서로 이어서 같은 순서를 낸다', async () => {
    const streams = {
      seoul: [row('a', 1), row('a', 2), row('b', 5), row('c', 7)],
      gyeonggi: [row('x', 3), row('y', 6)],
    };
    const fetchPage = backend(streams);

    const first = await pullMergedPrices({
      cursor: createPriceCursor(['seoul', 'gyeonggi']),
      sort: 'price_asc',
      fetchPage,
      minNewHospitals: 2,
      maxRows: 100,
    });
    expect(first.rows.map((r) => r.ykiho)).toEqual(['a', 'a', 'x']);
    expect(first.next?.seen).toEqual(['a', 'x']);

    const second = await pullMergedPrices({
      cursor: first.next!,
      sort: 'price_asc',
      fetchPage,
      minNewHospitals: 10,
      maxRows: 100,
    });
    expect(prices([...first.rows, ...second.rows])).toEqual([1, 2, 3, 5, 6, 7]);
    expect(second.next).toBeUndefined();
  });

  it('비어 있는 목록만 다음 페이지를 받고 이미 받은 행은 다시 받지 않는다', async () => {
    const fetchPage = backend({
      seoul: [row('a', 1), row('b', 2), row('c', 3), row('d', 4)],
      gyeonggi: [row('x', 10)],
    });

    await pullMergedPrices({
      cursor: createPriceCursor(['seoul', 'gyeonggi']),
      sort: 'price_asc',
      fetchPage,
      minNewHospitals: 10,
      maxRows: 100,
    });

    expect(fetchPage.mock.calls).toEqual([
      ['seoul', 0],
      ['gyeonggi', 0],
      ['seoul', 1],
    ]);
  });

  it('커서를 고치지 않아 같은 커서로 다시 불러도 결과가 같다', async () => {
    const fetchPage = backend({ all: [row('a', 1), row('b', 2), row('c', 3)] });
    const cursor = createPriceCursor(['all']);
    const options = {
      sort: 'price_asc' as const,
      fetchPage,
      minNewHospitals: 1,
      maxRows: 100,
    };

    const first = await pullMergedPrices({ cursor, ...options });
    const again = await pullMergedPrices({ cursor, ...options });

    expect(again.rows).toEqual(first.rows);
    expect(cursor.streams[0]?.nextPage).toBe(0);
    expect(cursor.seen).toEqual([]);
  });

  it('한 병원의 행이 끝없이 이어져도 maxRows에서 멈춘다', async () => {
    const fetchPage = backend({
      all: Array.from({ length: 20 }, (_, i) => row('a', i)),
    });

    const { rows, next } = await pullMergedPrices({
      cursor: createPriceCursor(['all']),
      sort: 'price_asc',
      fetchPage,
      minNewHospitals: 5,
      maxRows: 6,
    });

    expect(rows).toHaveLength(6);
    expect(next).toBeDefined();
  });

  it('결과가 없으면 빈 묶음과 끝(undefined)을 돌려준다', async () => {
    const { rows, next } = await pullMergedPrices({
      cursor: createPriceCursor(['seoul', 'gyeonggi']),
      sort: 'price_asc',
      fetchPage: backend({}),
      minNewHospitals: 10,
      maxRows: 100,
    });

    expect(rows).toEqual([]);
    expect(next).toBeUndefined();
  });

  it('백엔드 실패는 그대로 던진다', async () => {
    const promise = pullMergedPrices({
      cursor: createPriceCursor(['seoul']),
      sort: 'price_asc',
      fetchPage: () => Promise.reject(new Error('down')),
      minNewHospitals: 10,
      maxRows: 100,
    });

    await expect(promise).rejects.toThrow('down');
  });
});
