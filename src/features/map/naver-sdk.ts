import type { NaverMapsApi } from './naver-types';

/** NCP 통합 콘솔 이후 키 이름은 ncpKeyId다(이전 ncpClientId·govClientId·finClientId는 새 키로 바꿔야 한다). */
const SDK_URL = 'https://oapi.map.naver.com/openapi/v3/maps.js';

type SdkWindow = {
  naver?: { maps?: NaverMapsApi };
  navermap_authFailure?: () => void;
};
type SdkDocument = {
  createElement(tag: 'script'): {
    src: string;
    async: boolean;
    onload: (() => void) | null;
    onerror: (() => void) | null;
  };
  head: { append(node: never): void };
};
type SdkTarget = { window: SdkWindow; document: SdkDocument };

export function buildSdkUrl(clientId: string) {
  return `${SDK_URL}?${new URLSearchParams({ ncpKeyId: clientId })}`;
}

let loading: Promise<NaverMapsApi> | null = null;
let hasAuthFailed = false;
const authFailureListeners = new Set<() => void>();

/** 인증 실패(등록하지 않은 도메인·잘못된 키)는 스크립트가 로드된 뒤 window.navermap_authFailure로만 알려 준다. */
export function onNaverAuthFailure(listener: () => void) {
  if (hasAuthFailed) listener();
  authFailureListeners.add(listener);
  return () => {
    authFailureListeners.delete(listener);
  };
}

/** SDK를 앱에서 한 번만 불러온다. 실패하면 다음 호출에서 다시 시도할 수 있게 비운다. */
export function loadNaverMaps(
  clientId: string,
  target: SdkTarget = {
    window: window as SdkWindow,
    document: document as unknown as SdkDocument,
  },
) {
  if (loading) return loading;
  target.window.navermap_authFailure = () => {
    hasAuthFailed = true;
    for (const listener of authFailureListeners) listener();
  };
  loading = new Promise<NaverMapsApi>((resolve, reject) => {
    const loaded = target.window.naver?.maps;
    if (loaded) {
      resolve(loaded);
      return;
    }
    const script = target.document.createElement('script');
    script.src = buildSdkUrl(clientId);
    script.async = true;
    script.onload = () => {
      const api = target.window.naver?.maps;
      if (api) resolve(api);
      else reject(new Error('Naver Maps SDK loaded without naver.maps'));
    };
    script.onerror = () => reject(new Error('Naver Maps SDK failed to load'));
    target.document.head.append(script as never);
  }).catch((error: unknown) => {
    loading = null;
    throw error;
  });
  return loading;
}

/** 테스트에서 모듈 상태(한 번만 불러오기, 인증 실패)를 처음으로 돌린다. */
export function resetNaverSdkForTest() {
  loading = null;
  hasAuthFailed = false;
  authFailureListeners.clear();
}
