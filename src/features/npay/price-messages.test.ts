import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';

import { messages } from '@/i18n/messages/ko';

const t = createTranslator({
  locale: 'ko',
  messages,
  namespace: 'common.price',
});

describe('common.price.compactRange', () => {
  it('만·천 단위로 줄여 "37만~495만원"처럼 쓴다', () => {
    expect(t('compactRange', { min: 370_000, max: 4_952_520 })).toBe(
      '37만~495만원',
    );
    expect(t('compactRange', { min: 1_000, max: 500_000 })).toBe('1천~50만원');
    expect(t('compactRange', { min: 45_000, max: 1_446_000 })).toBe(
      '4.5만~145만원',
    );
  });
});
