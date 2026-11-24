/* eslint-disable no-restricted-syntax -- 꼬리말은 화면 문구가 아니라 사용자가 입력한 검색어에서 떼어 낼 값이다. */
/** 사람들이 붙여 쓰는 꼬리말. 항목 이름에는 보통 없다. 긴 것부터 뗀다. */
const SUFFIXES = ['가격', '비용', '수술', '주사', '시술', '값', '비'] as const;

/**
 * 항목이 0건일 때 한 번 더 찾아 볼 검색어. 띄어쓰기를 빼고("도수 치료"→"도수치료"), 끝의 꼬리말 하나를 뗀다
 * ("임플란트 가격"→"임플란트", "도수치료비"→"도수치료"). 바뀌는 게 없으면 null이다.
 */
export function relaxedKeyword(keyword: string): string | null {
  const original = keyword.trim();
  let next = original.replace(/\s+/g, '');
  const suffix = SUFFIXES.find(
    (value) => next.endsWith(value) && next.length >= value.length + 2,
  );
  if (suffix) next = next.slice(0, -suffix.length);
  return next && next !== original ? next : null;
}
