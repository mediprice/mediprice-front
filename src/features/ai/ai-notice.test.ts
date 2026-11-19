import { afterEach, describe, expect, it } from 'vitest';

import {
  acknowledgeNotice,
  AI_NOTICE_VERSION,
  aiProviders,
  forgetNoticesInMemory,
  hasAcknowledgedNotice,
} from './ai-notice';

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    values,
  };
}

afterEach(() => forgetNoticesInMemory());

describe('AI 안내 확인 기록', () => {
  it('처음에는 확인하지 않은 상태이고, 확인하면 버전을 남긴다', () => {
    const storage = memoryStorage();

    expect(hasAcknowledgedNotice('ai', storage)).toBe(false);
    acknowledgeNotice('ai', storage);

    expect(storage.values.get('mediprice:ai-notice')).toBe(AI_NOTICE_VERSION);
    forgetNoticesInMemory();
    expect(hasAcknowledgedNotice('ai', storage)).toBe(true);
  });

  it('버전이 바뀌면 다시 확인받는다', () => {
    const storage = memoryStorage({ 'mediprice:ai-notice': '2020-01-01' });

    expect(hasAcknowledgedNotice('ai', storage)).toBe(false);
  });

  it('글 안내와 음성 안내는 따로 기록한다', () => {
    const storage = memoryStorage();
    acknowledgeNotice('ai', storage);
    forgetNoticesInMemory();

    expect(hasAcknowledgedNotice('voice', storage)).toBe(false);
  });

  it('저장소가 막혀 있어도 같은 화면에서는 다시 묻지 않는다', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };

    expect(hasAcknowledgedNotice('ai', broken)).toBe(false);
    acknowledgeNotice('ai', broken);
    expect(hasAcknowledgedNotice('ai', broken)).toBe(true);
  });
});

describe('aiProviders', () => {
  const processor = (
    task: 'database' | 'llmGateway' | 'llmModel',
    company: string | null,
    countries: ('US' | 'KR')[] | null = null,
  ) => ({ task, company, contact: null, countries, retention: null });

  it('LLM 중계·모델 업체만 고르고 같은 업체는 한 번만 쓴다', () => {
    expect(
      aiProviders([
        processor('database', 'DB Co'),
        processor('llmGateway', 'Gate', ['US']),
        processor('llmModel', 'Gate', ['US']),
      ]),
    ).toEqual([{ company: 'Gate', countries: ['US'] }]);
  });

  it('업체를 아직 정하지 않았으면 null 하나로 남겨 확정 필요로 보이게 한다', () => {
    expect(
      aiProviders([processor('llmGateway', null), processor('llmModel', null)]),
    ).toEqual([{ company: null, countries: null }]);
  });
});
