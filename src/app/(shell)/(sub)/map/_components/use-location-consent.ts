'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { consentMutations } from '@/features/auth/queries';
import { showToast } from '@/features/feedback/toast-store';
import { errorMessageKey } from '@/lib/api/error-message';

/** 위치 동의 창의 열림과 저장. 저장에 성공하면 창을 닫고 onAgreed를 부르고, 실패하면 창을 연 채 알린다. */
export function useLocationConsent({
  onAgreed,
  onDeclined,
}: {
  onAgreed: () => void;
  /** 동의하지 않고 닫았을 때. */
  onDeclined: () => void;
}) {
  const tErrors = useTranslations('errors');
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const save = useMutation(consentMutations.agreeLocation(queryClient));

  return {
    isOpen,
    isSaving: save.isPending,
    open: () => setIsOpen(true),
    /** 저장 중에는 닫지 않는다. */
    close: () => {
      if (save.isPending) return;
      setIsOpen(false);
      onDeclined();
    },
    agree: () =>
      save.mutate(undefined, {
        onSuccess: () => {
          setIsOpen(false);
          onAgreed();
        },
        onError: (error) => showToast(tErrors(errorMessageKey(error))),
      }),
  };
}
