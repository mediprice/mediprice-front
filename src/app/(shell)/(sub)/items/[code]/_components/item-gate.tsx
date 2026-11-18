'use client';

import { useQuery } from '@tanstack/react-query';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { npayQueries } from '@/features/npay/queries';
import { errorMessageKey } from '@/lib/api/error-message';
import { ApiError } from '@/lib/api/errors';

/** 없는 항목 코드면 가격 화면 대신 "찾을 수 없음"을 보여 준다. 다른 실패는 각 조각이 따로 다룬다. */
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

  if (error instanceof ApiError && error.status === 404) {
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
