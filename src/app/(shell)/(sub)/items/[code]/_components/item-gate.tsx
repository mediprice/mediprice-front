'use client';

import { useQuery } from '@tanstack/react-query';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useRecordView } from '@/features/history/use-record-view';
import { npayQueries } from '@/features/npay/queries';
import { errorMessageKey } from '@/lib/api/error-message';

import { isItemNotFound } from './use-item-ready';

/** 없는 코드는 서버가 404로 끝낸다. 서버가 백엔드를 읽지 못해 브라우저가 다시 읽었을 때만 여기서 "찾을 수 없음"을 보여 준다. */
export function ItemGate({
  code,
  children,
}: {
  code: string;
  children: ReactNode;
}) {
  const t = useTranslations('items');
  const tErrors = useTranslations('errors');
  const { error } = useQuery(npayQueries.detail(code));
  useRecordView(npayQueries.detail(code));

  if (isItemNotFound(error)) {
    return (
      <PageContainer className="py-section">
        <h1 className="sr-only">{t('header.fallbackTitle')}</h1>
        <EmptyState
          icon={<FileQuestion />}
          title={tErrors(errorMessageKey(error))}
          description={t('notFound.description')}
          action={
            <Button asChild variant="tint" size="md">
              <Link href="/search">{t('notFound.search')}</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }
  return children;
}
