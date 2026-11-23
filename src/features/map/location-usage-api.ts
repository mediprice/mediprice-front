import { BFF_BASE } from '@/lib/api/paths';
import { emitSessionExpired } from '@/lib/api/session-events';
import { createUntypedRequest } from '@/lib/api/untyped-request';

/** 위치 이용 기록 API가 아직 schema.d.ts에 없어 untyped 요청을 쓴다. 백엔드 배포 후 생성 클라이언트로 바꾼다. */
export function createLocationUsageApi(
  request = createUntypedRequest({
    baseUrl: BFF_BASE,
    onSessionExpired: emitSessionExpired,
  }),
) {
  return {
    /** 주변 병원 검색에 현재 위치를 쓴 사실만 남긴다(좌표는 보내지 않는다). 동의가 없으면 403이다. */
    record: () =>
      request.empty('/api/users/me/location-usages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'NEARBY_HOSPITALS' }),
      }),
  };
}

/** 브라우저 전용이다(상대 경로 `/bff`를 쓴다). */
export const locationUsageApi = createLocationUsageApi();
