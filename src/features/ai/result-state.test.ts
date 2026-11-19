import { describe, expect, it } from 'vitest';

import { resolveResultState } from './result-state';

const loaded = (name: string) => ({
  data: { name },
  isPending: false,
  isError: false,
  isMissing: false,
});
const pending = {
  data: undefined,
  isPending: true,
  isError: false,
  isMissing: false,
};
const missing = {
  data: undefined,
  isPending: false,
  isError: true,
  isMissing: true,
};
const broken = {
  data: undefined,
  isPending: false,
  isError: true,
  isMissing: false,
};

describe('resolveResultState', () => {
  it('이름을 찾은 항목만 순서대로 남기고 받는 중인 개수를 센다', () => {
    expect(
      resolveResultState(['A', 'B', 'C'], [loaded('a'), pending, missing]),
    ).toEqual({
      kind: 'list',
      entries: [{ item: 'A', detail: { name: 'a' } }],
      pendingCount: 1,
    });
  });

  it('아직 아무것도 받지 못했어도 받는 중이면 목록 자리를 둔다', () => {
    expect(resolveResultState(['A', 'B'], [pending, pending])).toEqual({
      kind: 'list',
      entries: [],
      pendingCount: 2,
    });
  });

  it('모든 코드가 공개 데이터에 없으면 찾지 못함이다', () => {
    expect(resolveResultState(['A', 'B'], [missing, missing])).toEqual({
      kind: 'missing',
    });
  });

  it('하나라도 404가 아닌 실패면 다시 불러올 수 있는 오류다', () => {
    expect(resolveResultState(['A', 'B'], [missing, broken])).toEqual({
      kind: 'loadError',
    });
  });
});
