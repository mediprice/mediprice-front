'use client';

import { Check, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { isNpayCode } from '../compare-params';
import { useCompareStore } from '../compare-store';

/** 병원을 비교함에 담거나 뺀다. 가득 찼을 때의 안내와 스크린 리더 알림은 CompareTray가 맡는다. */
export function CompareToggle({
  ykiho,
  name,
  itemCode,
  className,
}: {
  ykiho: string;
  name: string;
  /** 담은 화면의 항목. 비교 화면에서 이 항목의 가격을 먼저 보여 준다. */
  itemCode?: string | null;
  className?: string;
}) {
  const t = useTranslations('comparison.toggle');
  const isAdded = useCompareStore((state) =>
    state.hospitals.some((hospital) => hospital.ykiho === ykiho),
  );
  const add = useCompareStore((state) => state.add);
  const remove = useCompareStore((state) => state.remove);

  function handleClick() {
    if (isAdded) {
      remove(ykiho);
      return;
    }
    add({ ykiho, name, itemCode: isNpayCode(itemCode) ? itemCode : null });
  }

  return (
    <Button
      variant={isAdded ? 'outline' : 'tint'}
      size="sm"
      aria-pressed={isAdded}
      onClick={handleClick}
      className={cn(
        'z-10',
        isAdded &&
          'border-primary bg-primary-tint text-primary-text hover:bg-primary-tint-hover active:bg-primary-tint-pressed',
        className,
      )}
    >
      {isAdded ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
      {isAdded ? t('added') : t('add')}
    </Button>
  );
}
