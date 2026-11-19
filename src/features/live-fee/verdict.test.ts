import { describe, expect, it } from 'vitest';

import type { LiveFeeItem } from './schemas';
import { itemVerdict, parsePublishedMonth, summarizeVerdict } from './verdict';

function item(overrides: Partial<LiveFeeItem> = {}): LiveFeeItem {
  return {
    code: 'C1',
    name: '도수치료',
    dbMinPrice: 80000,
    dbMaxPrice: 80000,
    webMinPrice: 80000,
    webMaxPrice: 80000,
    webPublishedMonth: '2026-10',
    changed: false,
    ...overrides,
  };
}

describe('itemVerdict', () => {
  it('누리집 가격이 있으면 changed로 같음·다름을 가른다', () => {
    expect(itemVerdict(item())).toBe('same');
    expect(itemVerdict(item({ changed: true, webMaxPrice: 85000 }))).toBe(
      'changed',
    );
  });

  it('누리집 가격이 없으면 changed가 true여도 정보 없음이다', () => {
    expect(
      itemVerdict(
        item({ webMinPrice: null, webMaxPrice: null, changed: true }),
      ),
    ).toBe('none');
  });

  it('최저·최고 중 하나만 있어도 비교한다', () => {
    expect(itemVerdict(item({ webMinPrice: null }))).toBe('same');
  });
});

describe('summarizeVerdict', () => {
  const none = item({ webMinPrice: null, webMaxPrice: null });

  it('하나라도 다르면 다름이다', () => {
    expect(summarizeVerdict([item(), item({ changed: true }), none])).toBe(
      'changed',
    );
  });

  it('비교한 항목이 모두 같으면 같음이다', () => {
    expect(summarizeVerdict([item(), none])).toBe('same');
  });

  it('비교할 항목이 없으면 정보 없음이다', () => {
    expect(summarizeVerdict([])).toBe('none');
    expect(summarizeVerdict([none])).toBe('none');
  });
});

describe('parsePublishedMonth', () => {
  it.each(['2026-10', '202610', '2026-10-01'])(
    '%s를 그 달로 읽는다',
    (value) => {
      expect(parsePublishedMonth(value)?.toISOString()).toBe(
        '2026-10-15T00:00:00.000Z',
      );
    },
  );

  it.each([null, '', '10월', '2026-13'])('%s는 읽지 않는다', (value) => {
    expect(parsePublishedMonth(value)).toBeNull();
  });
});
