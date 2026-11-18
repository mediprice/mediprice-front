'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { WithdrawDialog } from './withdraw-dialog';

export function WithdrawSection() {
  const t = useTranslations('mypage.account');
  const [isConfirming, setIsConfirming] = useState(false);
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
        onClick={() => setIsConfirming(true)}
        className="w-full lg:w-auto lg:bg-bg"
      >
        {t('withdraw')}
      </Button>
      <WithdrawDialog open={isConfirming} onOpenChange={setIsConfirming} />
    </section>
  );
}
