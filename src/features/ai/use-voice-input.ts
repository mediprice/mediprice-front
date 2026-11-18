import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { aiApi } from './api';
import {
  startRecorderSession,
  startSpeechSession,
  type VoiceHandlers,
  type VoiceSession,
} from './voice-engines';
import {
  MAX_RECORDING_SECONDS,
  pickVoiceEngine,
  transcribeAudio,
  VOICE_OFF,
  voiceReducer,
} from './voice-state';

const subscribeNothing = () => () => {};

/** 음성은 글로 바꾼 뒤 확인 단계(confirm)에서 멈춘다. 보내기는 사용자가 확인한 뒤 부르는 쪽이 한다. */
export function useVoiceInput() {
  const engine = useSyncExternalStore(
    subscribeNothing,
    () => pickVoiceEngine(window),
    () => null,
  );
  const [state, dispatch] = useReducer(voiceReducer, VOICE_OFF);
  const [elapsed, setElapsed] = useState(0);
  const sessionRef = useRef<VoiceSession | null>(null);
  const audioRef = useRef<Blob | null>(null);
  const convertingRef = useRef<AbortController | null>(null);
  const startedAtRef = useRef(0);

  const convert = useCallback(async (audio: Blob) => {
    convertingRef.current?.abort();
    const controller = new AbortController();
    convertingRef.current = controller;
    dispatch({ type: 'stopped' });
    const outcome = await transcribeAudio(audio, (blob) =>
      aiApi.transcribe(blob, { signal: controller.signal }),
    );
    if (controller.signal.aborted) return;
    dispatch(
      outcome.ok
        ? { type: 'transcribed', text: outcome.text }
        : { type: 'failed', error: outcome.error },
    );
  }, []);

  const start = useCallback(() => {
    if (!engine) return;
    sessionRef.current?.abort();
    convertingRef.current?.abort();
    audioRef.current = null;
    setElapsed(0);
    dispatch({ type: 'open' });
    const handlers: VoiceHandlers = {
      onStart: () => {
        startedAtRef.current = Date.now();
        dispatch({ type: 'started' });
      },
      onInterim: (text) => dispatch({ type: 'interim', text }),
      onText: (text) => dispatch({ type: 'transcribed', text }),
      onAudio: (audio) => {
        audioRef.current = audio;
        void convert(audio);
      },
      onError: (error) => dispatch({ type: 'failed', error }),
    };
    sessionRef.current =
      engine === 'speech'
        ? startSpeechSession(handlers)
        : startRecorderSession(handlers);
  }, [engine, convert]);

  const finish = useCallback(() => {
    dispatch({ type: 'stopped' });
    sessionRef.current?.stop();
  }, []);

  const cancel = useCallback(() => {
    sessionRef.current?.abort();
    sessionRef.current = null;
    convertingRef.current?.abort();
    dispatch({ type: 'close' });
  }, []);

  /** 변환만 실패했으면 녹음을 다시 받지 않고 같은 음성을 다시 보낸다. */
  const retry = useCallback(() => {
    const isConvertFailure =
      state.phase === 'error' &&
      (state.error === 'network' || state.error === 'unavailable');
    if (isConvertFailure && audioRef.current) void convert(audioRef.current);
    else start();
  }, [state, convert, start]);

  const isRecording = state.phase === 'recording';
  useEffect(() => {
    if (!isRecording) return;
    const timer = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsed(Math.min(seconds, MAX_RECORDING_SECONDS));
      if (seconds >= MAX_RECORDING_SECONDS) finish();
    }, 250);
    return () => window.clearInterval(timer);
  }, [isRecording, finish]);

  useEffect(
    () => () => {
      sessionRef.current?.abort();
      convertingRef.current?.abort();
    },
    [],
  );

  return { engine, state, elapsed, start, finish, cancel, retry };
}
