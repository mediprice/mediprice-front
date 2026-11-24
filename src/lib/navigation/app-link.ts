/** 누른 것이 앱 안 다른 화면으로 가는 링크면 그 주소를 준다. 새 탭·다운로드·다른 출처·같은 화면 안 이동(#앵커)은 브라우저가 처리하므로 `null`이다. */
export function appLinkTarget(event: MouseEvent): URL | null {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    !(event.target instanceof Element)
  ) {
    return null;
  }
  const anchor = event.target.closest('a[href]');
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (
    (anchor.target && anchor.target !== '_self') ||
    anchor.hasAttribute('download')
  ) {
    return null;
  }
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (
    url.pathname === window.location.pathname &&
    url.search === window.location.search
  ) {
    return null;
  }
  return url;
}
