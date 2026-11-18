'use client';

import { CircleAlert, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLiveFeeCheck } from '@/features/live-fee/use-live-fee-check';
import { errorMessageKey } from '@/lib/api/error-message';
import { cn } from '@/lib/utils';

import { LiveFeeResult } from './live-fee-result';

/** 선택한 항목의 가격을 심평원 누리집과 맞춰 본다. 누를 때만 조회하고, 버튼 하나가 모든 상태에서 같은 자리에 남아 포커스를 잃지 않는다. */
export function LiveFeeCheck({
  ykiho,
  npayCode,
  className,
}: {
  ykiho: string;
  npayCode: string;
  className?: string;
}) {
  const t = useTranslations('liveFee');
  const tErrors = useTranslations('errors');
  const hintId = useId();
  const { check, isChecking, result, error, secondsLeft } = useLiveFeeCheck(
    ykiho,
    npayCode,
  );
  const isCoolingDown = secondsLeft > 0 && !isChecking;
  const errorKey = error ? errorMessageKey(error) : null;

  const label = error
    ? isCoolingDown
      ? t('failure.retryIn', { seconds: secondsLeft })
      : t('failure.retry')
    : result
      ? t('check.again')
      : t('check.action');
  const hint = isCoolingDown
    ? error
      ? null
      : t('check.cooldown', { seconds: secondsLeft })
    : result || error || isChecking
      ? null
      : t('check.hint');

  return (
    <div data-slot="live-fee-check" className={cn('flex flex-col', className)}>
      <div className="flex flex-col gap-1.5">
        <Button
          variant="onTint"
          size="md"
          isLoading={isChecking}
          aria-disabled={isChecking || isCoolingDown || undefined}
          aria-describedby={hint ? hintId : undefined}
          onClick={check}
          className="w-full lg:w-fit"
        >
          <RefreshCw aria-hidden="true" />
          {label}
        </Button>
        {hint && (
          <p id={hintId} className="text-caption text-text-secondary">
            {hint}
          </p>
        )}
      </div>

      <div aria-live="polite" aria-busy={isChecking || undefined}>
        {isChecking ? (
          <div className="mt-3 flex flex-col gap-2 rounded-lg bg-bg px-4 py-4">
            <p className="text-label-bold text-text-primary">
              {t('checking.title')}
            </p>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/5" />
            <p className="text-body-sm text-text-secondary">
              {t('checking.description')}
            </p>
          </div>
        ) : errorKey ? (
          <div className="mt-3 flex flex-col gap-1 rounded-lg bg-bg px-4 py-4">
            <p className="flex items-center gap-2 text-label-bold text-text-primary">
              <CircleAlert
                aria-hidden="true"
                className="size-4 shrink-0 text-danger"
                strokeWidth={1.75}
              />
              {t('failure.title')}
            </p>
            <p className="text-body-sm text-text-secondary">
              {errorKey === 'aiUnavailable'
                ? t('failure.unavailable')
                : tErrors(errorKey)}
            </p>
          </div>
        ) : result ? (
          <LiveFeeResult result={result} className="mt-3" />
        ) : null}
      </div>
    </div>
  );
}
