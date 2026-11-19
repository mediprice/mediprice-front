import { create } from 'zustand';

/** 다이얼로그 설명 문구를 고른다(auth.loginDialog.reason.*). */
export type LoginReason =
  | 'general'
  | 'favorite'
  | 'history'
  | 'review'
  | 'medicalProfile'
  | 'ai'
  | 'expired';

type LoginDialogState = {
  isOpen: boolean;
  reason: LoginReason;
  /** 로그인 후 돌아올 경로. 없으면 연 순간의 현재 경로다. */
  returnTo: string | null;
  /** 닫을 때 포커스를 돌려줄 요소. Trigger 없이 열기 때문에 Radix가 대신 해 주지 않는다. */
  opener: HTMLElement | null;
};

const useLoginDialogStore = create<LoginDialogState>(() => ({
  isOpen: false,
  reason: 'general',
  returnTo: null,
  opener: null,
}));

/** 어디서든(이벤트 핸들러, 뮤테이션 onError) 로그인 다이얼로그를 연다. 다이얼로그는 셸 레이아웃의 AuthDialogs가 하나만 렌더한다. */
export function openLoginDialog({
  reason = 'general',
  returnTo = null,
}: { reason?: LoginReason; returnTo?: string | null } = {}) {
  const opener =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  useLoginDialogStore.setState({ isOpen: true, reason, returnTo, opener });
}

export function closeLoginDialog() {
  useLoginDialogStore.setState({ isOpen: false });
}

export function useLoginDialogState() {
  return useLoginDialogStore();
}
