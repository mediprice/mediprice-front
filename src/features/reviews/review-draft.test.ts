import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearReviewDraft,
  readReviewDraft,
  reviewDraftKey,
  writeReviewDraft,
} from './review-draft';

const store = new Map<string, string>();
Object.defineProperty(globalThis, 'window', {
  value: {
    sessionStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
  },
  configurable: true,
});

describe('review draft', () => {
  beforeEach(() => store.clear());

  it('새 후기와 고치는 후기는 다른 키를 쓴다', () => {
    expect(reviewDraftKey('Y1')).not.toBe(reviewDraftKey('Y1', 7));
  });

  it('쓴 내용을 다시 읽고, 지우면 사라진다', () => {
    const key = reviewDraftKey('Y1');
    writeReviewDraft(key, {
      rating: 4,
      content: '친절했어요',
      visitedOn: '',
      paidAmount: '',
    });
    expect(readReviewDraft(key)?.content).toBe('친절했어요');
    clearReviewDraft(key);
    expect(readReviewDraft(key)).toBeNull();
  });

  it('빈 초안은 남기지 않고, 형식이 틀린 값은 버린다', () => {
    const key = reviewDraftKey('Y1');
    writeReviewDraft(key, { content: '  ', visitedOn: '', paidAmount: '' });
    expect(store.has(key)).toBe(false);
    store.set(key, '{"rating":9}');
    expect(readReviewDraft(key)).toBeNull();
  });
});
