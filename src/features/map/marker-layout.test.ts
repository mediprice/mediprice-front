import { describe, expect, it } from 'vitest';

import {
  findCollapsedLabels,
  groupByPosition,
  nextMemberId,
  representativeOf,
} from './marker-layout';

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

const marker = (id: string, lat: number, lng: number, kind = 'price') => ({
  id,
  position: { lat, lng },
  kind,
});

describe('groupByPosition', () => {
  it('약 1m 안의 같은 자리는 목록 순서대로 한 묶음이 된다', () => {
    const groups = groupByPosition([
      marker('a', 37.5665, 126.978),
      marker('b', 37.5, 127),
      marker('c', 37.566501, 126.978002),
    ]);
    expect(groups.map((group) => group.members.map(({ id }) => id))).toEqual([
      ['a', 'c'],
      ['b'],
    ]);
  });

  it('소수 다섯째 자리가 다르면(약 1m 넘게 떨어지면) 따로 둔다', () => {
    expect(
      groupByPosition([
        marker('a', 37.5665, 126.978),
        marker('b', 37.56652, 126.978),
      ]),
    ).toHaveLength(2);
  });

  it('기준 장소(place)는 같은 자리의 병원과 묶지 않는다', () => {
    const groups = groupByPosition([
      marker('place', 37.5665, 126.978, 'place'),
      marker('a', 37.5665, 126.978),
    ]);
    expect(groups.map((group) => group.members.map(({ id }) => id))).toEqual([
      ['place'],
      ['a'],
    ]);
  });
});

describe('representativeOf', () => {
  const [group] = groupByPosition([
    marker('a', 37.5665, 126.978),
    marker('b', 37.5665, 126.978),
  ]);

  it('고른 병원이 묶음 안에 있으면 그 병원을 보인다', () => {
    expect(group && representativeOf(group, 'b').id).toBe('b');
  });

  it('없으면 목록에서 앞선 병원을 보인다', () => {
    expect(group && representativeOf(group, 'x').id).toBe('a');
    expect(group && representativeOf(group, null).id).toBe('a');
  });
});

describe('nextMemberId', () => {
  const abc = () => [{ id: 'a' }, { id: 'b' }, { id: 'c' }] as const;

  it('고른 병원이 묶음 밖이면 첫 병원을 고른다', () => {
    expect(nextMemberId(abc(), null)).toBe('a');
    expect(nextMemberId(abc(), 'x')).toBe('a');
  });

  it('누를 때마다 다음 병원으로 넘어가고 끝에서 처음으로 돌아온다', () => {
    expect(nextMemberId(abc(), 'a')).toBe('b');
    expect(nextMemberId(abc(), 'b')).toBe('c');
    expect(nextMemberId(abc(), 'c')).toBe('a');
  });

  it('한 곳뿐이면 늘 그 병원이다', () => {
    expect(nextMemberId([{ id: 'a' }], 'a')).toBe('a');
  });
});
