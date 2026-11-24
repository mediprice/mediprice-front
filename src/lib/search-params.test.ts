import { describe, expect, it } from 'vitest';

import { firstParam } from './search-params';

describe('firstParam', () => {
  it('여러 번 온 파라미터는 첫 값을 쓴다', () => {
    expect(firstParam(['a', 'b'])).toBe('a');
    expect(firstParam([])).toBeUndefined();
  });

  it('하나만 왔거나 없으면 그대로 둔다', () => {
    expect(firstParam('a')).toBe('a');
    expect(firstParam(undefined)).toBeUndefined();
  });
});
