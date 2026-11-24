import { describe, expect, it } from 'vitest';

import { nextDepth } from './history-depth';

describe('nextDepth', () => {
  it('처음 들어온 칸은 0이다', () => {
    expect(nextDepth(undefined, 1, null)).toBe(0);
    expect(nextDepth(undefined, 7, null)).toBe(0);
  });

  it('기록이 늘면(push) 앞 칸보다 하나 깊다', () => {
    expect(nextDepth(undefined, 3, { depth: 0, length: 2 })).toBe(1);
  });

  it('기록 길이가 그대로면(replace) 같은 깊이다', () => {
    expect(nextDepth(undefined, 2, { depth: 0, length: 2 })).toBe(0);
  });

  it('이미 적힌 깊이(뒤로·앞으로·새로 고침)는 그대로 쓴다', () => {
    expect(nextDepth(2, 5, { depth: 4, length: 5 })).toBe(2);
    expect(nextDepth(0, 5, { depth: 4, length: 5 })).toBe(0);
  });

  it('이상한 값은 표시가 없는 것으로 본다', () => {
    expect(nextDepth('1', 3, { depth: 0, length: 2 })).toBe(1);
    expect(nextDepth(-1, 2, null)).toBe(0);
  });
});
