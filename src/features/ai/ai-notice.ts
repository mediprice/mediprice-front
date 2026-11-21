import { LEGAL_FACTS } from '@/config/legal';

/** 안내 문구나 legal-facts.json의 AI 값(제공사·학습 이용)이 바뀌면 올린다. 저장된 값과 다르면 안내를 다시 보인다. */
export const AI_NOTICE_VERSION = '2026-11-19';

/** ai는 첫 전송 전, voice는 첫 음성 입력 전에 확인받는다. */
export type AiNoticeKind = 'ai' | 'voice';

const STORAGE_KEYS: Record<AiNoticeKind, string> = {
  ai: 'mediprice:ai-notice',
  voice: 'mediprice:ai-voice-notice',
};

type NoticeStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** 저장소를 쓸 수 없는 브라우저(사생활 보호 모드 등)에서도 같은 화면에서 두 번 묻지 않게 메모리에 둔다. */
const acknowledgedInMemory = new Set<AiNoticeKind>();

function browserStorage(): NoticeStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function hasAcknowledgedNotice(
  kind: AiNoticeKind,
  storage: NoticeStorage | null = browserStorage(),
) {
  if (acknowledgedInMemory.has(kind)) return true;
  try {
    return storage?.getItem(STORAGE_KEYS[kind]) === AI_NOTICE_VERSION;
  } catch {
    return false;
  }
}

export function acknowledgeNotice(
  kind: AiNoticeKind,
  storage: NoticeStorage | null = browserStorage(),
) {
  acknowledgedInMemory.add(kind);
  try {
    storage?.setItem(STORAGE_KEYS[kind], AI_NOTICE_VERSION);
  } catch {}
}

/** 테스트에서 메모리 기록을 지운다. */
export function forgetNoticesInMemory() {
  acknowledgedInMemory.clear();
}

type Processor = (typeof LEGAL_FACTS.processors)[number];

export type AiProvider = Pick<Processor, 'company' | 'countries'>;

/** AI 찾기 입력을 받는 외부 업체(LLM 중계·모델). 같은 업체(아직 정하지 않은 업체 포함)는 한 번만 쓴다. 값이 null이면 화면이 "운영자 확정 필요"로 보인다. */
export function aiProviders(processors = LEGAL_FACTS.processors): AiProvider[] {
  const providers: AiProvider[] = [];
  for (const processor of processors) {
    if (processor.task !== 'llmGateway' && processor.task !== 'llmModel') {
      continue;
    }
    const isDuplicate = providers.some(
      (provider) => provider.company === processor.company,
    );
    if (!isDuplicate) {
      providers.push({
        company: processor.company,
        countries: processor.countries,
      });
    }
  }
  return providers;
}
