/** 비교함 바를 띄우지 않는 화면. 비교 화면은 주소가 비교 대상이고, 지도는 화면 높이를 꽉 채우며, 내 정보·법적 문서는 비교와 상관없고 자체 하단 바나 떠 있는 버튼이 있다. */
const HIDDEN_EXACT = new Set(['/compare', '/map', '/privacy', '/terms']);
const HIDDEN_PREFIXES = ['/my/', '/policy/'];

export function isTrayHiddenOn(pathname: string) {
  return (
    HIDDEN_EXACT.has(pathname) ||
    HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}
