'use client';

import { onlineManager } from '@tanstack/react-query';
import { WifiOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void) => onlineManager.subscribe(onChange);

/** 인터넷이 끊기면 요청이 멈춰 버튼이 아무 반응도 없는 것처럼 보이므로, 끊긴 동안 화면 위에 알린다. 다시 연결되면 멈춘 요청은 이어진다. */
export function ConnectionBanner() {
  const t = useTranslations('common.connection');
  const isOnline = useSyncExternalStore(
    subscribe,
    () => onlineManager.isOnline(),
    () => true,
  );
  if (isOnline) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-(--z-toast) flex items-center justify-center gap-2 bg-warning-tint py-2.5 px-page text-body-sm text-warning"
    >
      <WifiOff
        aria-hidden="true"
        className="size-4 shrink-0"
        strokeWidth={1.75}
      />
      <span>{t('offline')}</span>
    </div>
  );
}
