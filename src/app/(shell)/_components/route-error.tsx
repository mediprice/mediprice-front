'use client';

import { CircleAlert } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

/** 셸 안 화면의 렌더 실패. 레이아웃(내비게이션)은 남기고 본문만 바꾼다. 에러 내용은 화면에 쓰지 않고 콘솔에만 남긴다. */
export function RouteError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const t = useTranslations('errors.page.error');
  const tActions = useTranslations('common.actions');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer className="flex flex-1 items-center justify-center py-section">
      <EmptyState
        titleAs="h1"
        icon={<CircleAlert />}
        title={t('title')}
        description={t('description')}
        action={
          <>
            <Button variant="tint" size="md" onClick={retry}>
              {tActions('retry')}
            </Button>
            <Button asChild variant="ghost" size="md">
              <Link href="/">{t('home')}</Link>
            </Button>
          </>
        }
      />
    </PageContainer>
  );
}
