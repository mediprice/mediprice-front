import { loginUrl } from './oauth';
import {
  readReturnPath,
  sanitizeReturnPath,
  saveReturnPath,
} from './return-path';

/** 돌아올 경로를 백엔드(return_to)와 sessionStorage(아직 return_to를 모르는 백엔드용) 양쪽에 남기고 구글 로그인으로 이동한다. 경로를 주지 않으면 현재 화면이다. */
export function startGoogleLogin(returnTo: string | null = null) {
  const path = returnTo ?? window.location.pathname + window.location.search;
  saveReturnPath(path);
  window.location.assign(
    loginUrl({
      origin: window.location.origin,
      returnTo: sanitizeReturnPath(path) ?? readReturnPath(),
    }),
  );
}
