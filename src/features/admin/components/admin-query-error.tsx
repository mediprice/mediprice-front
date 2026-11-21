'use client';

import { CircleAlert, ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { errorMessageKey } from '@/lib/api/error-message';
import { ApiError } from '@/lib/api/errors';

/** 운영 API 실패. 403은 계정 역할이 바뀌었지만 토큰의 역할이 아직 예전 값일 때라 다시 로그인하라고 알린다. */
export function AdminQueryError({
  error,
  title,
  isRetrying,
  onRetry,
  className,
}: {
  error: unknown;
  title: string;
  isRetrying: boolean;
  onRetry: () => void;
  className?: string;
}) {
  const t = useTranslations('admin.access');
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('common.actions');

  if (error instanceof ApiError && error.status === 403) {
    return (
      <EmptyState
        className={className}
        icon={<ShieldAlert />}
        title={t('forbiddenTitle')}
        description={t('forbiddenDescription')}
      />
    );
  }

  return (
    <EmptyState
      className={className}
      icon={<CircleAlert />}
      title={title}
      description={tErrors(errorMessageKey(error))}
      action={
        <Button
          variant="tint"
          size="md"
          isLoading={isRetrying}
          onClick={onRetry}
        >
          {tActions('retry')}
        </Button>
      }
    />
  );
}
