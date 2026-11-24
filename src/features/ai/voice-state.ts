import { classifyTranscribeError, type VoiceError } from './ai-errors';

/** mediprice-ai의 음성 변환 상한(60초, 5MB). */
export const MAX_RECORDING_SECONDS = 60;
export const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

/** speech는 브라우저 음성 인식, recorder는 녹음 후 서버 변환이다. 둘 다 없으면 마이크 버튼을 숨긴다. */
export type VoiceEngine = 'speech' | 'recorder';

/** ready는 권한을 묻거나 마이크를 여는 중(대기), confirm은 보내기 전에 고칠 수 있는 확인 단계다. */
export type VoiceState =
  | { phase: 'off' }
  | { phase: 'ready' }
  | { phase: 'recording'; interim: string }
  | { phase: 'transcribing' }
  | { phase: 'confirm'; text: string }
  | { phase: 'error'; error: VoiceError };

export type VoiceAction =
  | { type: 'open' }
  | { type: 'started' }
  | { type: 'interim'; text: string }
  | { type: 'stopped' }
  | { type: 'transcribed'; text: string }
  | { type: 'failed'; error: VoiceError }
  | { type: 'close' };

export const VOICE_OFF: VoiceState = { phase: 'off' };

export function voiceReducer(state: VoiceState, action: VoiceAction) {
  switch (action.type) {
    case 'open':
      return { phase: 'ready' } satisfies VoiceState;
    case 'started':
      return state.phase === 'ready'
        ? ({ phase: 'recording', interim: '' } satisfies VoiceState)
        : state;
    case 'interim':
      return state.phase === 'recording'
        ? ({ phase: 'recording', interim: action.text } satisfies VoiceState)
        : state;
    case 'stopped':
      return state.phase === 'recording' || state.phase === 'error'
        ? ({ phase: 'transcribing' } satisfies VoiceState)
        : state;
    case 'transcribed': {
      if (state.phase === 'off' || state.phase === 'confirm') return state;
      const text = action.text.trim();
      return text
        ? ({ phase: 'confirm', text } satisfies VoiceState)
        : ({ phase: 'error', error: 'noSpeech' } satisfies VoiceState);
    }
    case 'failed':
      return state.phase === 'off'
        ? state
        : ({ phase: 'error', error: action.error } satisfies VoiceState);
    case 'close':
      return VOICE_OFF;
  }
}

/** 브라우저 음성 인식을 먼저 쓰고, 없으면 녹음해서 서버로 보낸다. */
export function pickVoiceEngine(scope: object): VoiceEngine | null {
  if (
    typeof Reflect.get(scope, 'SpeechRecognition') === 'function' ||
    typeof Reflect.get(scope, 'webkitSpeechRecognition') === 'function'
  ) {
    return 'speech';
  }
  const navigator: unknown = Reflect.get(scope, 'navigator');
  const mediaDevices: unknown =
    typeof navigator === 'object' && navigator !== null
      ? Reflect.get(navigator, 'mediaDevices')
      : undefined;
  if (
    typeof Reflect.get(scope, 'MediaRecorder') === 'function' &&
    typeof mediaDevices === 'object' &&
    mediaDevices !== null &&
    typeof Reflect.get(mediaDevices, 'getUserMedia') === 'function'
  ) {
    return 'recorder';
  }
  return null;
}

/** 사용자가 취소한 경우(aborted)는 오류가 아니라서 null이다. */
export function speechErrorOf(code: string): VoiceError | null {
  switch (code) {
    case 'aborted':
      return null;
    case 'no-speech':
      return 'noSpeech';
    case 'audio-capture':
      return 'noMic';
    case 'not-allowed':
    case 'service-not-allowed':
      return 'denied';
    case 'network':
      return 'network';
    default:
      return 'unavailable';
  }
}

export function mediaErrorOf(error: unknown): VoiceError {
  const name =
    typeof error === 'object' && error !== null
      ? Reflect.get(error, 'name')
      : undefined;
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'noMic';
  }
  return 'unavailable';
}

export type TranscribeOutcome =
  { ok: true; text: string } | { ok: false; error: VoiceError };

/** 빈 녹음·빈 결과는 "잘 안 들렸어요"로, 서버 오류는 음성 오류 종류로 바꾼다. */
export async function transcribeAudio(
  audio: Blob,
  transcribe: (audio: Blob) => Promise<string>,
): Promise<TranscribeOutcome> {
  if (audio.size === 0) return { ok: false, error: 'noSpeech' };
  if (audio.size > MAX_AUDIO_BYTES) return { ok: false, error: 'tooLarge' };
  try {
    const text = (await transcribe(audio)).trim();
    return text ? { ok: true, text } : { ok: false, error: 'noSpeech' };
  } catch (error) {
    return { ok: false, error: classifyTranscribeError(error) };
  }
}
