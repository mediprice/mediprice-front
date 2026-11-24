import { z } from 'zod/mini';

import { firstParam } from '@/lib/search-params';

/** 서비스 지역. 기본은 서울·경기(metro)이고 all은 전국이다. URL의 region 파라미터 값과 같다. */
export const SERVICE_REGIONS = ['metro', 'seoul', 'gyeonggi', 'all'] as const;
export type ServiceRegion = (typeof SERVICE_REGIONS)[number];
export const DEFAULT_REGION: ServiceRegion = 'metro';

const SIDO_CODE = { seoul: '110000', gyeonggi: '310000' } as const;

const regionSchema = z.pipe(
  z.transform(firstParam),
  z.catch(z.enum(SERVICE_REGIONS), DEFAULT_REGION),
);

export function parseServiceRegion(value: unknown): ServiceRegion {
  return regionSchema.parse(value);
}

/** 백엔드는 시도 하나만 받으므로 서울·경기는 두 코드로 나눠 조회한다. 빈 배열은 조건 없는(전국) 조회다. */
export function sidoCodesOf(region: ServiceRegion): string[] {
  if (region === 'metro') return [SIDO_CODE.seoul, SIDO_CODE.gyeonggi];
  if (region === 'all') return [];
  return [SIDO_CODE[region]];
}

/** 링크에 붙일 region 쿼리. 기본값은 URL을 짧게 두려고 뺀다. */
export function regionQuery(region: ServiceRegion): { region?: ServiceRegion } {
  return region === DEFAULT_REGION ? {} : { region };
}
