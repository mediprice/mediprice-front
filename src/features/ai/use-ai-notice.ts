'use client';

import { useState } from 'react';

import {
  acknowledgeNotice,
  type AiNoticeKind,
  hasAcknowledgedNotice,
} from './ai-notice';

type Pending = { kinds: AiNoticeKind[]; resume: () => void };

/** ensure()가 false면 안내를 열고 행동을 멈춘다. 확인하면 기록을 남기고 resume으로 이어 간다. */
export function useAiNotice() {
  const [pending, setPending] = useState<Pending | null>(null);

  function ensure(kinds: AiNoticeKind[], resume: () => void) {
    const missing = kinds.filter((kind) => !hasAcknowledgedNotice(kind));
    if (missing.length === 0) return true;
    setPending({ kinds: missing, resume });
    return false;
  }

  function confirm() {
    if (!pending) return;
    for (const kind of pending.kinds) acknowledgeNotice(kind);
    setPending(null);
    pending.resume();
  }

  return {
    kinds: pending?.kinds ?? [],
    ensure,
    confirm,
    dismiss: () => setPending(null),
  };
}
