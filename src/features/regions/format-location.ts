/* eslint-disable no-restricted-syntax -- 시도 이름은 화면 문구가 아니라 HIRA 데이터와 비교하는 값이다. */
const METROPOLITAN = new Set([
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  '세종',
]);

/**
 * HIRA 시군구 이름을 읽기 좋게 바꾼다. 광역시는 앞의 시 이름을 빼고("부산남구" → "남구"),
 * 구가 있는 일반 시는 시와 구를 띄운다("부천원미구" → "부천시 원미구", 해당 시 이름은 모두 두 글자다).
 */
export function formatLocation(
  sidoName: string | null | undefined,
  sgguName: string | null | undefined,
) {
  const sido = sidoName?.trim() ?? '';
  let sggu = sgguName?.trim() ?? '';

  if (sido && sggu.startsWith(sido) && sggu.length > sido.length) {
    sggu = sggu.slice(sido.length);
  } else if (
    !METROPOLITAN.has(sido) &&
    sggu.length >= 4 &&
    sggu.endsWith('구') &&
    !sggu.includes(' ')
  ) {
    sggu = `${sggu.slice(0, 2)}시 ${sggu.slice(2)}`;
  }
  return [sido, sggu].filter(Boolean).join(' ');
}
