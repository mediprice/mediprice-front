import { CloudOff } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { errorMessageKey } from '@/lib/api/error-message';

import { StatusPanel } from './status-panel';

/** 첫 페이지 조회 실패. 검색 조건은 URL에 그대로 있으므로 같은 요청을 다시 보낸다. */
export function ResultsError({
  error,
  isRetrying,
  onRetry,
}: {
  error: unknown;
  isRetrying: boolean;
  onRetry: () => void;
}) {
  const t = useTranslations();
  const tErrors = useTranslations('errors');
  return (
    <StatusPanel
      role="alert"
      icon={<CloudOff />}
      title={t('search.error.title')}
      description={tErrors(errorMessageKey(error))}
      actions={
        <>
          <Button size="md" isLoading={isRetrying} onClick={onRetry}>
            {t('common.actions.retry')}
          </Button>
          <Button asChild size="md" variant="tint">
            <Link href="/">{t('search.error.home')}</Link>
          </Button>
        </>
      }
    />
  );
}
