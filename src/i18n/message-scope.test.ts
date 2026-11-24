import { describe, expect, it } from 'vitest';

import { mergeMessages, pickMessages } from './message-scope';

const messages = {
  common: { actions: { close: '닫기' }, brand: 'Mediprice' },
  legal: { document: { toc: '목차' }, privacy: { title: '처리방침' } },
};

describe('pickMessages', () => {
  it('네임스페이스 전체나 점으로 이은 하위 묶음만 고른다', () => {
    expect(pickMessages(messages, ['common', 'legal.document'])).toEqual({
      common: messages.common,
      legal: { document: { toc: '목차' } },
    });
  });

  it('없는 경로는 건너뛴다', () => {
    expect(pickMessages(messages, ['legal.missing', 'missing'])).toEqual({
      legal: {},
    });
  });
});

describe('mergeMessages', () => {
  it('같은 네임스페이스의 하위 묶음을 합친다', () => {
    const base = pickMessages(messages, ['common', 'legal.document']);
    const extra = pickMessages(messages, ['legal.privacy']);
    expect(mergeMessages(base, extra)).toEqual(messages);
    expect(base).toEqual({
      common: messages.common,
      legal: { document: { toc: '목차' } },
    });
  });
});
