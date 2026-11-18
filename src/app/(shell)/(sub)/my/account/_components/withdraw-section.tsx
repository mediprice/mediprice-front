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
      className="flex flex-col items-start gap-2 rounded-2xl bg-surface p-5 lg:p-6"
    >
      <h2 id="withdraw-title" className="text-subheading">
        {t('dangerTitle')}
      </h2>
      <p className="text-body text-text-secondary">{t('dangerDescription')}</p>
      <Button
        variant="outline"
        size="md"
        onClick={() => setIsConfirming(true)}
        className="mt-2 w-full text-danger md:w-fit"
      >
        {t('withdraw')}
      </Button>
      <WithdrawDialog open={isConfirming} onOpenChange={setIsConfirming} />
    </section>
  );
}
