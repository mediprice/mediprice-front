import { describe, expect, it } from 'vitest';

import { ApiError, NetworkError } from '@/lib/api/errors';

import {
  MAX_AUDIO_BYTES,
  mediaErrorOf,
  pickVoiceEngine,
  speechErrorOf,
  transcribeAudio,
  type VoiceAction,
  voiceReducer,
  type VoiceState,
} from './voice-state';

const run = (...actions: VoiceAction[]) =>
  actions.reduce<VoiceState>(voiceReducer, { phase: 'off' });

describe('voiceReducer', () => {
  it('대기 → 녹음 → 변환 → 확인 순서로 간다', () => {
    expect(run({ type: 'open' })).toEqual({ phase: 'ready' });
    expect(run({ type: 'open' }, { type: 'started' })).toEqual({
      phase: 'recording',
      interim: '',
    });
    expect(
      run(
        { type: 'open' },
        { type: 'started' },
        { type: 'interim', text: '허리가' },
      ),
    ).toEqual({ phase: 'recording', interim: '허리가' });
    expect(
      run({ type: 'open' }, { type: 'started' }, { type: 'stopped' }),
    ).toEqual({
      phase: 'transcribing',
    });
    expect(
      run(
        { type: 'open' },
        { type: 'started' },
        { type: 'stopped' },
        { type: 'transcribed', text: ' 허리가 아파요 ' },
      ),
    ).toEqual({ phase: 'confirm', text: '허리가 아파요' });
  });

  it('빈 결과는 "잘 안 들렸어요" 오류다', () => {
    expect(run({ type: 'open' }, { type: 'transcribed', text: '  ' })).toEqual({
      phase: 'error',
      error: 'noSpeech',
    });
  });

  it('닫은 뒤에 도착한 결과와 오류는 무시한다', () => {
    const closed = run({ type: 'open' }, { type: 'close' });
    expect(
      voiceReducer(closed, { type: 'transcribed', text: '늦은 결과' }),
    ).toEqual({
      phase: 'off',
    });
    expect(voiceReducer(closed, { type: 'failed', error: 'network' })).toEqual({
      phase: 'off',
    });
  });

  it('변환 실패 뒤 다시 시도하면 변환 중으로 돌아간다', () => {
    expect(
      run(
        { type: 'open' },
        { type: 'failed', error: 'network' },
        { type: 'stopped' },
      ),
    ).toEqual({ phase: 'transcribing' });
  });
});

describe('pickVoiceEngine', () => {
  const recorderScope = {
    MediaRecorder: function MediaRecorder() {},
    navigator: { mediaDevices: { getUserMedia: () => {} } },
  };

  it('브라우저 음성 인식(webkit 접두사 포함)을 먼저 쓴다', () => {
    expect(
      pickVoiceEngine({ webkitSpeechRecognition: function Fake() {} }),
    ).toBe('speech');
    expect(
      pickVoiceEngine({
        ...recorderScope,
        SpeechRecognition: function Fake() {},
      }),
    ).toBe('speech');
  });

  it('음성 인식이 없으면 녹음 후 서버 변환으로 대신한다', () => {
    expect(pickVoiceEngine(recorderScope)).toBe('recorder');
  });

  it('둘 다 없으면 null이다(마이크 버튼을 숨긴다)', () => {
    expect(pickVoiceEngine({})).toBeNull();
    expect(
      pickVoiceEngine({ MediaRecorder: function M() {}, navigator: {} }),
    ).toBeNull();
  });
});

describe('오류 분류', () => {
  it('음성 인식 오류 코드를 화면 상태로 바꾸고, 취소는 오류로 보지 않는다', () => {
    expect(speechErrorOf('aborted')).toBeNull();
    expect(speechErrorOf('no-speech')).toBe('noSpeech');
    expect(speechErrorOf('not-allowed')).toBe('denied');
    expect(speechErrorOf('service-not-allowed')).toBe('denied');
    expect(speechErrorOf('network')).toBe('network');
    expect(speechErrorOf('audio-capture')).toBe('noMic');
    expect(speechErrorOf('language-not-supported')).toBe('unavailable');
  });

  it('마이크 권한 거부와 장치 없음을 구분한다', () => {
    expect(mediaErrorOf(new DOMException('', 'NotAllowedError'))).toBe(
      'denied',
    );
    expect(mediaErrorOf(new DOMException('', 'NotFoundError'))).toBe('noMic');
    expect(mediaErrorOf(new Error('?'))).toBe('unavailable');
  });
});

describe('transcribeAudio', () => {
  const audio = (size: number) =>
    new Blob([new Uint8Array(size)], { type: 'audio/webm' });

  it('바꾼 글을 다듬어 돌려준다', async () => {
    await expect(
      transcribeAudio(audio(10), async () => ' 허리가 아파요\n'),
    ).resolves.toEqual({
      ok: true,
      text: '허리가 아파요',
    });
  });

  it('빈 녹음과 빈 결과는 서버에 보내지 않거나 noSpeech로 본다', async () => {
    let calls = 0;
    const transcribe = async () => {
      calls += 1;
      return '';
    };
    await expect(transcribeAudio(audio(0), transcribe)).resolves.toEqual({
      ok: false,
      error: 'noSpeech',
    });
    expect(calls).toBe(0);
    await expect(transcribeAudio(audio(10), transcribe)).resolves.toEqual({
      ok: false,
      error: 'noSpeech',
    });
  });

  it('5MB를 넘는 음성은 보내지 않는다', async () => {
    await expect(
      transcribeAudio(audio(MAX_AUDIO_BYTES + 1), async () => '안 불림'),
    ).resolves.toEqual({ ok: false, error: 'tooLarge' });
  });

  it('서버 오류를 음성 오류 종류로 바꾼다', async () => {
    const fail = (error: unknown) => async () => {
      throw error;
    };
    await expect(
      transcribeAudio(audio(10), fail(new NetworkError(null))),
    ).resolves.toEqual({
      ok: false,
      error: 'network',
    });
    await expect(
      transcribeAudio(
        audio(10),
        fail(new ApiError(413, 'AI_AUDIO_TOO_LARGE', '')),
      ),
    ).resolves.toEqual({ ok: false, error: 'tooLarge' });
    await expect(
      transcribeAudio(audio(10), fail(new ApiError(503, 'AI_UNAVAILABLE', ''))),
    ).resolves.toEqual({ ok: false, error: 'unavailable' });
  });
});
