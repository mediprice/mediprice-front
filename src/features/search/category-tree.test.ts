import { describe, expect, it } from 'vitest';

import { otherCategories, resolveCategoryView } from './category-tree';

const CATEGORIES = [
  {
    code: '1070Z',
    name: '이학요법료',
    subCategories: [
      { code: '1070Z050', name: '도수치료' },
      { code: '1070Z060', name: '증식치료' },
      { code: null, name: '코드 없음' },
    ],
  },
  {
    code: '1100Z',
    name: '치과 처치· 수술료',
    subCategories: [{ code: '1100Z010', name: '치석제거' }],
  },
  {
    code: '1180Z',
    name: null,
    subCategories: [{ code: '1180Z010', name: '치과임플란트(1치당)' }],
  },
];

describe('resolveCategoryView', () => {
  it('대분류 하나인 홈 분야는 그 하위 분류를 칩으로 보여 주고 대분류 전체를 조회한다', () => {
    expect(resolveCategoryView(CATEGORIES, { homeCodes: ['1070Z'] })).toEqual({
      trail: [],
      scopeCodes: ['1070Z'],
      scopeNames: ['이학요법료'],
      chips: [
        { code: '1070Z050', name: '도수치료' },
        { code: '1070Z060', name: '증식치료' },
      ],
      parentCode: undefined,
      selectedCode: undefined,
    });
  });

  it('대분류가 여럿인 홈 분야는 대분류를 칩으로 보여 주고 고른 칩만 조회한다', () => {
    const view = resolveCategoryView(CATEGORIES, {
      homeCodes: ['1100Z', '1180Z'],
      code: '1180Z',
    });

    expect(view?.chips).toEqual([
      { code: '1100Z', name: '치과 처치· 수술료' },
      { code: '1180Z', name: '1180Z' },
    ]);
    expect(view?.selectedCode).toBe('1180Z');
    expect(view?.scopeCodes).toEqual(['1180Z']);
    expect(view?.scopeNames).toEqual(['1180Z']);
    expect(view?.trail).toEqual([{ code: '1180Z', name: '1180Z' }]);
  });

  it('홈 분야에 없는 코드는 찾지 못한다', () => {
    expect(
      resolveCategoryView(CATEGORIES, { homeCodes: ['1070Z'], code: '1100Z' }),
    ).toBeNull();
  });

  it('대분류 코드는 그 대분류와 하위 분류 칩을, 하위 분류 코드는 부모까지의 경로를 만든다', () => {
    expect(resolveCategoryView(CATEGORIES, { code: '1070Z' })).toMatchObject({
      trail: [{ code: '1070Z', name: '이학요법료' }],
      parentCode: '1070Z',
      selectedCode: undefined,
    });
    expect(resolveCategoryView(CATEGORIES, { code: '1070Z060' })).toEqual({
      trail: [
        { code: '1070Z', name: '이학요법료' },
        { code: '1070Z060', name: '증식치료' },
      ],
      scopeCodes: ['1070Z060'],
      scopeNames: ['증식치료'],
      chips: [
        { code: '1070Z050', name: '도수치료' },
        { code: '1070Z060', name: '증식치료' },
      ],
      parentCode: '1070Z',
      selectedCode: '1070Z060',
    });
  });

  it('없는 코드나 조건이 없으면 null이다', () => {
    expect(resolveCategoryView(CATEGORIES, { code: '9999Z' })).toBeNull();
    expect(resolveCategoryView(CATEGORIES, {})).toBeNull();
  });
});

describe('otherCategories', () => {
  it('홈 분야의 대분류를 빼고 공식 이름 가나다순으로 정렬한다', () => {
    expect(
      otherCategories(
        [
          ...CATEGORIES,
          { code: '1010A', name: '상급병실료', subCategories: [] },
          { code: '1021Z', name: '검체검사료', subCategories: [] },
        ],
        ['1070Z', '1100Z', '1180Z'],
      ),
    ).toEqual([
      { code: '1021Z', name: '검체검사료' },
      { code: '1010A', name: '상급병실료' },
    ]);
  });
});
