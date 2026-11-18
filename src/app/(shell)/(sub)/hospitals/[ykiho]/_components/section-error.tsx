'use client';

import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { errorMessageKey } from '@/lib/api/error-message';
import { cn } from '@/lib/utils';

/** 한 구역만 실패했을 때 그 자리에 문구와 다시 시도를 보여 준다. 다시 불러오는 동안에도 남아 있어 포커스를 잃지 않는다. */
export function SectionError({
  error,
  onRetry,
  isRetrying = false,
  className,
}: {
  error: unknown;
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
}) {
  const t = useTranslations('errors');
  const tActions = useTranslations('common.actions');
  return (
    <div
      role="alert"
      aria-busy={isRetrying || undefined}
      className={cn(
        'flex flex-col items-start gap-3 rounded-xl bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="flex items-start gap-2 text-body-sm text-text-secondary">
        <CircleAlert
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-danger"
          strokeWidth={1.75}
        />
        {t(errorMessageKey(error))}
      </p>
      <Button
        variant="outline"
        size="sm"
        isLoading={isRetrying}
        onClick={onRetry}
      >
        {tActions('retry')}
      </Button>
    </div>
  );
}
