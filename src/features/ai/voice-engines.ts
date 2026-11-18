import type { VoiceError } from './ai-errors';
import { mediaErrorOf, speechErrorOf } from './voice-state';

export type VoiceHandlers = {
  onStart: () => void;
  onInterim: (text: string) => void;
  /** 브라우저 음성 인식이 끝났을 때의 글. */
  onText: (text: string) => void;
  /** 녹음이 끝났을 때의 음성. 서버 변환은 부르는 쪽이 한다. */
  onAudio: (audio: Blob) => void;
  onError: (error: VoiceError) => void;
};

export type VoiceSession = {
  /** 말하기를 마친다(결과를 받는다). */
  stop: () => void;
  /** 결과 없이 끝낸다. */
  abort: () => void;
};

type RecognitionResultList = ArrayLike<
  ArrayLike<{ transcript: string }> & { isFinal: boolean }
>;

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult:
    | ((event: { resultIndex: number; results: RecognitionResultList }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type RecognitionConstructor = new () => Recognition;

function findRecognition(): RecognitionConstructor | null {
  for (const name of ['SpeechRecognition', 'webkitSpeechRecognition']) {
    const value: unknown = Reflect.get(window, name);
    /** 표준화 전 API라 lib.dom에 생성자 타입이 없다. pickVoiceEngine이 함수인지 확인했다. */
    if (typeof value === 'function') return value as RecognitionConstructor;
  }
  return null;
}

export function startSpeechSession(handlers: VoiceHandlers): VoiceSession {
  const Constructor = findRecognition();
  if (!Constructor) {
    handlers.onError('unavailable');
    return { stop: () => {}, abort: () => {} };
  }
  const recognition = new Constructor();
  recognition.lang = 'ko-KR';
  recognition.continuous = true;
  recognition.interimResults = true;

  let finalText = '';
  let interimText = '';
  let isDone = false;

  recognition.onstart = handlers.onStart;
  recognition.onresult = (event) => {
    interimText = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const transcript = result?.[0]?.transcript ?? '';
      if (result?.isFinal) finalText += transcript;
      else interimText += transcript;
    }
    handlers.onInterim(`${finalText}${interimText}`);
  };
  recognition.onerror = (event) => {
    if (isDone) return;
    isDone = true;
    const error = speechErrorOf(event.error);
    if (error) handlers.onError(error);
  };
  recognition.onend = () => {
    if (isDone) return;
    isDone = true;
    handlers.onText(`${finalText}${interimText}`);
  };

  try {
    recognition.start();
  } catch {
    isDone = true;
    handlers.onError('unavailable');
  }

  return {
    stop: () => recognition.stop(),
    abort: () => {
      isDone = true;
      recognition.abort();
    },
  };
}

const RECORDER_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg',
];

export function startRecorderSession(handlers: VoiceHandlers): VoiceSession {
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let isCancelled = false;
  const chunks: Blob[] = [];

  const release = () => stream?.getTracks().forEach((track) => track.stop());

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((granted) => {
      stream = granted;
      if (isCancelled) {
        release();
        return;
      }
      const mimeType = RECORDER_TYPES.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      recorder = new MediaRecorder(granted, mimeType ? { mimeType } : {});
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        release();
        if (isCancelled) return;
        handlers.onAudio(
          new Blob(chunks, { type: recorder?.mimeType || mimeType }),
        );
      };
      recorder.onstart = handlers.onStart;
      recorder.start();
    })
    .catch((error: unknown) => {
      if (!isCancelled) handlers.onError(mediaErrorOf(error));
    });

  return {
    stop: () => {
      if (recorder?.state === 'recording') recorder.stop();
    },
    abort: () => {
      isCancelled = true;
      if (recorder?.state === 'recording') recorder.stop();
      release();
    },
  };
}
