'use client';

import { useQuery } from '@tanstack/react-query';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { npayQueries } from '@/features/npay/queries';
import { errorMessageKey } from '@/lib/api/error-message';

import { formatItemTitle } from './item-title';
import { isItemNotFound } from './use-item-ready';

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
  const { data, error } = useQuery(npayQueries.detail(code));
  const isNotFound = isItemNotFound(error);
  const documentTitle = data
    ? t('metadata.documentTitle', { name: formatItemTitle(data) })
    : isNotFound
      ? t('metadata.notFoundTitle')
      : undefined;

  /** 항목 이름은 브라우저에서만 받을 수 있다. 필터를 바꿀 때 Next가 공통 제목으로 되돌리므로 head를 지켜보며 다시 맞춘다. */
  useEffect(() => {
    if (!documentTitle) return;
    const apply = () => {
      if (document.title !== documentTitle) document.title = documentTitle;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, [documentTitle]);

  if (isNotFound) {
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
