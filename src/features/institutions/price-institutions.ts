/**
 * 비급여 진료비를 공개하지 않는 종별(약국·조산원·보건기관·비요양기관)과 묶음 코드. 필터에 두면 고를 때마다 0건이라 뺀다.
 * 병원급·의원급·치과·한방은 남긴다(공개 대상이며 데이터가 늘어날 수 있다).
 */
const NO_PRICE_CODES = new Set([
  '61',
  '71',
  '72',
  '73',
  '75',
  '81',
  '99',
  'AA',
]);

export function isPricedInstitution(code: string) {
  return !NO_PRICE_CODES.has(code);
}
