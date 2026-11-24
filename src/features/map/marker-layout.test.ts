import { describe, expect, it } from 'vitest';

import { findCollapsedLabels } from './marker-layout';

const pin = (id: string, x: number, y: number, label = '45,000원') => ({
  id,
  x,
  y,
  label,
});

describe('findCollapsedLabels', () => {
  it('멀리 떨어진 가격 알약은 모두 글자로 둔다', () => {
    expect(
      findCollapsedLabels([pin('a', 0, 0), pin('b', 200, 0), pin('c', 0, 100)]),
    ).toEqual(new Set());
  });

  it('같은 건물처럼 겹치면 앞(가까운 순)의 것만 남기고 뒤는 점으로 줄인다', () => {
    expect(
      findCollapsedLabels([pin('a', 0, 0), pin('b', 10, 5), pin('c', 30, 10)]),
    ).toEqual(new Set(['b', 'c']));
  });

  it('고른 병원은 순서와 상관없이 글자를 남기고 겹친 다른 것을 줄인다', () => {
    expect(
      findCollapsedLabels([pin('a', 0, 0), pin('b', 10, 5)], ['b']),
    ).toEqual(new Set(['a']));
  });

  it('위아래로 알약 높이 넘게 떨어지면 겹치지 않는다', () => {
    expect(findCollapsedLabels([pin('a', 0, 0), pin('b', 0, 40)])).toEqual(
      new Set(),
    );
  });

  it('긴 문구("가격 정보 없음")는 더 넓게 차지한다', () => {
    expect(
      findCollapsedLabels([pin('a', 0, 0, '가격 정보 없음'), pin('b', 80, 0)]),
    ).toEqual(new Set(['b']));
    expect(
      findCollapsedLabels([pin('a', 0, 0, '1원'), pin('b', 90, 0, '1원')]),
    ).toEqual(new Set());
  });
});
