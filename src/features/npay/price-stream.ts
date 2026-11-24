import type { components } from '@/lib/api/schema';

export type HospitalPrice = components['schemas']['HospitalPriceResponse'];
type PricePage = components['schemas']['PageResponseHospitalPriceResponse'];

export type PriceSortOrder = 'price_asc' | 'price_desc';

/** 백엔드 목록 하나(시도 하나)의 읽기 위치. buffer는 받아 두었지만 아직 내보내지 않은 행이다. */
type PriceStream<C> = {
  condition: C;
  nextPage: number;
  buffer: HospitalPrice[];
  isDone: boolean;
};

export type PriceCursor<C> = {
  streams: PriceStream<C>[];
  /** 이미 내보낸 병원(ykiho). 한 번에 새 병원을 몇 곳 이상 보여 주려고 센다. */
  seen: string[];
};

export function createPriceCursor<C>(conditions: readonly C[]): PriceCursor<C> {
  return {
    streams: conditions.map((condition) => ({
      condition,
      nextPage: 0,
      buffer: [],
      isDone: false,
    })),
    seen: [],
  };
}

type PullOptions<C> = {
  cursor: PriceCursor<C>;
  sort: PriceSortOrder;
  fetchPage: (condition: C, page: number) => Promise<PricePage>;
  /** 이만큼 새 병원이 나오면 멈춘다. */
  minNewHospitals: number;
  /** 한 병원의 행이 아주 많아도 한 번에 이 수를 넘겨 읽지 않는다. */
  maxRows: number;
};

/**
 * 가격순으로 정렬된 여러 목록(서울·경기)을 하나로 합쳐 다음 묶음을 꺼낸다(k-way merge).
 * 각 목록의 맨 앞을 비교해야 하므로 비어 있는 목록은 다음 페이지를 먼저 받는다. 커서는 고치지 않고 새로 만든다.
 */
export async function pullMergedPrices<C>({
  cursor,
  sort,
  fetchPage,
  minNewHospitals,
  maxRows,
}: PullOptions<C>) {
  const streams = cursor.streams.map((stream) => ({
    ...stream,
    buffer: [...stream.buffer],
  }));
  const seen = new Set(cursor.seen);
  const rows: HospitalPrice[] = [];
  let newHospitals = 0;
  const isBefore = (a: HospitalPrice, b: HospitalPrice) =>
    sort === 'price_asc' ? a.price < b.price : a.price > b.price;

  while (rows.length < maxRows && newHospitals < minNewHospitals) {
    await Promise.all(
      streams.map(async (stream) => {
        if (stream.buffer.length > 0 || stream.isDone) return;
        const page = await fetchPage(stream.condition, stream.nextPage);
        stream.buffer = [...page.content];
        stream.nextPage = page.page + 1;
        stream.isDone =
          page.content.length === 0 || page.page + 1 >= page.totalPages;
      }),
    );

    let best: (typeof streams)[number] | undefined;
    for (const stream of streams) {
      const head = stream.buffer[0];
      const bestHead = best?.buffer[0];
      if (head && (!bestHead || isBefore(head, bestHead))) best = stream;
    }
    const row = best?.buffer.shift();
    if (!row) break;

    rows.push(row);
    if (!seen.has(row.ykiho)) {
      seen.add(row.ykiho);
      newHospitals += 1;
    }
  }

  const hasMore = streams.some(
    (stream) => stream.buffer.length > 0 || !stream.isDone,
  );
  const next: PriceCursor<C> | undefined = hasMore
    ? { streams, seen: [...seen] }
    : undefined;
  return { rows, next };
}
