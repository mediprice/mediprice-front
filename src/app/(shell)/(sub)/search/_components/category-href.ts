/** 분류 화면 링크. 경로(Breadcrumb)는 문자열 href만 받으므로 쿼리를 직접 붙인다. */
export function categoryHref(query: Record<string, string>) {
  return `/search?${new URLSearchParams(query).toString()}` as const;
}
