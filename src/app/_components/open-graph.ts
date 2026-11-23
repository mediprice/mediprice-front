import type { Metadata } from 'next';

/**
 * og:url을 넣는 화면용. 하위 화면이 openGraph를 정하면 루트 값을 통째로 덮으므로(병합하지 않음) 루트와 같은 공통 값을 함께 넣는다.
 * 사이트 이름은 루트와 같은 metadata.title이다.
 */
export function openGraphFor(
  url: string,
  siteName: string,
): NonNullable<Metadata['openGraph']> {
  return { type: 'website', siteName, locale: 'ko_KR', url };
}
