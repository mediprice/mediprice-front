import { useEffect, useState } from 'react';
import { create } from 'zustand';

export type ReviewNoticeKind = 'created' | 'updated' | 'deleted';

type StoredNotice = { scope: string; kind: ReviewNoticeKind } | null;

const useReviewNoticeStore = create<{ notice: StoredNotice }>(() => ({
  notice: null,
}));

/** 작성·수정 화면에서 돌아간 목록이 결과 문구를 한 번 보여 주게 남긴다. scope는 병원 ykiho 또는 'my'다. */
export function setReviewNotice(scope: string, kind: ReviewNoticeKind) {
  useReviewNoticeStore.setState({ notice: { scope, kind } });
}

/** 화면에 들어올 때 남겨진 문구를 한 번만 가져오고 지운다. 같은 화면 안에서 생긴 결과는 반환된 setter로 보여 준다. */
export function useReviewNotice(scope: string) {
  const stored = useReviewNoticeStore((state) =>
    state.notice?.scope === scope ? state.notice.kind : null,
  );
  const [kind, setKind] = useState<ReviewNoticeKind | null>(stored);
  useEffect(() => {
    if (stored) useReviewNoticeStore.setState({ notice: null });
  }, [stored]);
  return [kind, setKind] as const;
}
