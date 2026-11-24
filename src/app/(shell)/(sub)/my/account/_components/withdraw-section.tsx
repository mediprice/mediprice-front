'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';

import { WithdrawDialog } from './withdraw-dialog';

export function WithdrawSection() {
  const t = useTranslations('mypage.account');
  const [isConfirming, setIsConfirming] = useState(false);
  /** 다이얼로그를 Trigger 없이 열어 Radix가 포커스를 돌려주지 못하므로 직접 돌려준다. */
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <section
      aria-labelledby="withdraw-title"
      className="flex flex-col gap-3 border-t border-hairline pt-8"
    >
      <SectionHeader
        id="withdraw-title"
        title={t('dangerTitle')}
        description={t('dangerDescription')}
      />
      <Button
        variant="dangerText"
        size="md"
        ref={triggerRef}
        onClick={() => setIsConfirming(true)}
        className="w-full md:w-fit"
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
