import { describe, expect, it } from 'vitest';

import {
  parseSavedView,
  parseSavedViewKey,
  savedViewKey,
  withSavedView,
} from './saved-view';

describe('parseSavedView', () => {
  it('기록에 남긴 보기와 선택을 읽는다', () => {
    expect(
      parseSavedView({
        __NA: true,
        mpMapView: { view: 'map', selectedId: 'abc' },
      }),
    ).toEqual({ view: 'map', selectedId: 'abc' });
  });

  it('선택이 문자열이 아니면 선택 없이 보기만 되살린다', () => {
    expect(
      parseSavedView({ mpMapView: { view: 'list', selectedId: 3 } }),
    ).toEqual({ view: 'list', selectedId: null });
    expect(parseSavedView({ mpMapView: { view: 'list' } })).toEqual({
      view: 'list',
      selectedId: null,
    });
  });

  it('기록이 없거나 보기 값이 다르면 null이다', () => {
    expect(parseSavedView(null)).toBeNull();
    expect(parseSavedView({})).toBeNull();
    expect(parseSavedView({ mpMapView: 'map' })).toBeNull();
    expect(parseSavedView({ mpMapView: { view: 'grid' } })).toBeNull();
  });
});

describe('savedViewKey', () => {
  it('키로 바꿨다가 다시 읽으면 같은 값이다', () => {
    const state = withSavedView(null, { view: 'map', selectedId: 'abc' });
    expect(parseSavedViewKey(savedViewKey(state))).toEqual({
      view: 'map',
      selectedId: 'abc',
    });
    expect(parseSavedViewKey(savedViewKey(null))).toBeNull();
  });

  it('다른 기록 값은 그대로 둔다', () => {
    expect(
      withSavedView({ __NA: true }, { view: 'list', selectedId: null }),
    ).toEqual({ __NA: true, mpMapView: { view: 'list', selectedId: null } });
  });
});
