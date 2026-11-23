import { create } from 'zustand';

export type ToastAction = { label: string; onClick: () => void };

type Toast = {
  id: number;
  text: string;
  action?: ToastAction;
};

type ToastState = {
  toast: Toast | null;
  show: (text: string, action?: ToastAction) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

/** 화면 아래에 잠깐 뜨는 결과 알림 하나. 새 알림은 이전 알림을 바꾼다. */
export const useToastStore = create<ToastState>((set, get) => ({
  toast: null,
  show: (text, action) => set({ toast: { id: nextId++, text, action } }),
  dismiss: (id) => {
    if (get().toast?.id === id) set({ toast: null });
  },
}));

/** 컴포넌트 밖(뮤테이션 콜백 등)에서도 부를 수 있다. */
export function showToast(text: string, action?: ToastAction) {
  useToastStore.getState().show(text, action);
}
