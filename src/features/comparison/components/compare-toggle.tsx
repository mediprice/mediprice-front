'use client';

import { Check, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { Button } from '@/components/ui/button';
import { isNpayCode, MAX_COMPARE } from '@/features/comparison/compare-params';
import { useCompareStore } from '@/features/comparison/compare-store';
import { cn } from '@/lib/utils';

/**
 * 병원을 비교함에 담거나 뺀다. 3곳이 차면 담지 않은 병원의 버튼은 비활성으로 보이되(aria-disabled) 포커스와 누름은 남겨,
 * 눌렀을 때 CompareTray가 이유를 보여 주고 읽어 준다. 어느 병원과 바꿀지는 사용자가 비교함에서 고른다.
 * 목록에 같은 버튼이 여럿이라 접근성 이름에 병원 이름을 넣는다(보이는 문구를 그대로 포함).
 */
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
  const hintId = useId();
  const isAdded = useCompareStore((state) =>
    state.hospitals.some((hospital) => hospital.ykiho === ykiho),
  );
  const isFull = useCompareStore(
    (state) => state.hospitals.length >= MAX_COMPARE,
  );
  const isBlocked = isFull && !isAdded;
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
    <>
      <Button
        variant={isAdded ? 'outline' : 'tint'}
        size="sm"
        aria-label={t(isAdded ? 'addedNamed' : 'addNamed', { name })}
        aria-pressed={isAdded}
        aria-disabled={isBlocked || undefined}
        aria-describedby={isBlocked ? hintId : undefined}
        onClick={handleClick}
        className={cn(
          'z-10 inactive:pointer-events-auto inactive:cursor-not-allowed',
          isAdded &&
            'border-primary bg-primary-tint text-primary-text hover:bg-primary-tint-hover active:bg-primary-tint-pressed',
          className,
        )}
      >
        {isAdded ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
        {isAdded ? t('added') : t('add')}
      </Button>
      {isBlocked && (
        <span id={hintId} className="sr-only">
          {t('full', { max: MAX_COMPARE })}
        </span>
      )}
    </>
  );
}
