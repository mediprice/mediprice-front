/**
 * 홈의 분류 타일과 인기 항목. 이름·설명 문구는 messages/ko/home.json의 같은 id 키에 있다.
 * 분류는 백엔드 대분류(mdiv) 코드 묶음이고, 인기 항목은 dev 데이터에서 가격이 있는 상세 코드다.
 */
export const HOME_CATEGORIES = [
  { id: 'physio', categoryCodes: ['1070Z'] },
  { id: 'dental', categoryCodes: ['1100Z', '1180Z'] },
  { id: 'eye', categoryCodes: ['1991B'] },
  { id: 'vaccine', categoryCodes: ['1991C'] },
  { id: 'imaging', categoryCodes: ['1032A', '1032B', '1025A', '1025B'] },
] as const;

export type HomeCategoryId = (typeof HOME_CATEGORIES)[number]['id'];

export const POPULAR_ITEMS = [
  { id: 'manualTherapy', code: 'MX1220000', category: 'physio' },
  { id: 'implant', code: 'UB0010012', category: 'dental' },
  { id: 'lasik', code: '2Z9610001', category: 'eye' },
  { id: 'shockwave', code: 'SZ0840000', category: 'physio' },
  { id: 'lasek', code: '2Z9620001', category: 'eye' },
  { id: 'shinglesVaccine', code: '3Z5200303', category: 'vaccine' },
] as const satisfies ReadonlyArray<{
  id: string;
  code: string;
  category: HomeCategoryId;
}>;

export function findHomeCategory(id: string) {
  return HOME_CATEGORIES.find((category) => category.id === id);
}
