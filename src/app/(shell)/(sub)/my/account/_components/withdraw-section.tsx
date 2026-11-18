'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

import { WithdrawDialog } from './withdraw-dialog';

export function WithdrawSection() {
  const t = useTranslations('mypage.account');
  const [isConfirming, setIsConfirming] = useState(false);
  /** 다이얼로그를 Trigger 없이 열어 Radix가 포커스를 돌려주지 못하므로 직접 돌려준다. */
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <section
      aria-labelledby="withdraw-title"
      className="mt-4 flex flex-col gap-3 border-t border-hairline pt-6 lg:mt-2 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:rounded-xl lg:border-t-0 lg:bg-surface lg:p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="withdraw-title" className="text-subheading">
          {t('dangerTitle')}
        </h2>
        <p className="text-body-sm text-text-secondary">
          {t('dangerDescription')}
        </p>
      </div>
      <Button
        variant="dangerText"
        size="md"
        ref={triggerRef}
        onClick={() => setIsConfirming(true)}
        className="w-full lg:w-auto lg:bg-bg"
      >
        {t('withdraw')}
      </Button>
      <WithdrawDialog
        open={isConfirming}
        onOpenChange={(next) => {
          setIsConfirming(next);
          if (!next) requestAnimationFrame(() => triggerRef.current?.focus());
        }}
      />
    </section>
  );
}
