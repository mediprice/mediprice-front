/** 쿠키 Path와 API 클라이언트가 같은 값을 쓰는 BFF 기준 경로. */
export const BFF_BASE = '/bff';

/** 이 헤더가 붙은 BFF 요청은 로그인 쿠키가 있어도 Authorization 없이 백엔드에 전달된다. 개인을 알아볼 수 있는 값(대략의 위치)을 계정과 묶지 않으려는 공개 조회에 쓴다. */
export const ANONYMOUS_REQUEST_HEADER = 'x-mediprice-anonymous';

/** 이 헤더가 있는 GET /bff/session은 재발급하지 않고 refreshable만 알린다. 헤더가 없는 이전 JS 탭은 서버가 예전처럼 재발급한다. */
export const SESSION_PROBE_HEADER = 'x-mediprice-session-probe';
export const SESSION_PROBE_VERSION = '2';
