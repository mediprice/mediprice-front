import { ApiError, NetworkError } from '@/lib/api/errors';

/** 화면이 다르게 보여 주는 실패 종류. interrupted는 답을 받기 전에 새로 고쳤을 때, cancelled는 기다리다 그만뒀을 때다. */
export type TurnFailure =
  | 'quota'
  | 'unavailable'
  | 'network'
  | 'invalidInput'
  | 'interrupted'
  | 'cancelled'
  | 'unknown';

export type VoiceError =
  'noSpeech' | 'network' | 'denied' | 'noMic' | 'tooLarge' | 'unavailable';

/** 백엔드 코드가 바뀌어도 상태 코드로 같은 화면을 고른다. */
export function classifyTurnError(error: unknown): TurnFailure {
  if (error instanceof NetworkError) return 'network';
  if (!(error instanceof ApiError)) return 'unknown';
  if (error.code === 'AI_QUOTA_EXCEEDED' || error.status === 429) {
    return 'quota';
  }
  if (error.code === 'INVALID_INPUT' || error.status === 400) {
    return 'invalidInput';
  }
  if (
    error.code === 'AI_UNAVAILABLE' ||
    error.code === 'UPSTREAM_UNAVAILABLE' ||
    error.status >= 500
  ) {
    return 'unavailable';
  }
  return 'unknown';
}

export function classifyTranscribeError(error: unknown): VoiceError {
  if (error instanceof NetworkError) return 'network';
  if (
    error instanceof ApiError &&
    (error.code === 'AI_AUDIO_TOO_LARGE' || error.status === 413)
  ) {
    return 'tooLarge';
  }
  return 'unavailable';
}
