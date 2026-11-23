import 'server-only';

const NO_STORE = 'no-store';
const PUBLIC_CACHE = 'public, s-maxage=300, stale-while-revalidate=3600';

/** 로그인 여부와 상관없이 같은 답을 주고 최근 기록 같은 부수효과가 없는 조회만 둔다. 병원·항목 상세(로그인 시 최근 기록), 병원 검색(검색어 기록), 후기(mine), /api/users/me/**는 넣지 않는다. */
const PUBLIC_GET_PATHS = [
  /^\/api\/regions\/sido$/,
  /^\/api\/regions\/sido\/[^/]+\/sggu$/,
  /^\/api\/institution-types$/,
  /^\/api\/npay-items$/,
  /^\/api\/npay-items\/categories$/,
  /^\/api\/npay-items\/[^/]+\/(prices|price-summary)$/,
  /^\/api\/hospitals\/[^/]+\/prices(\/history)?$/,
];

/** 로그인하지 않은 사용자의 공개 조회 성공 응답만 CDN에 잠깐 둔다. 그 밖에는 모두 no-store다. */
export function cacheControlFor({
  method,
  backendPath,
  hasSession,
  status,
}: {
  method: string;
  backendPath: string;
  hasSession: boolean;
  status: number;
}) {
  const isCacheable =
    method === 'GET' &&
    !hasSession &&
    status === 200 &&
    PUBLIC_GET_PATHS.some((pattern) => pattern.test(backendPath));
  return isCacheable ? PUBLIC_CACHE : NO_STORE;
}
