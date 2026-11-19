import type { ReactNode } from 'react';

import { PageContainer } from '@/components/layout/page-container';

/** 결과 제목과 개수. 개수가 바뀌면 화면 낭독기가 status 문구를 읽는다. */
export function ResultHeader({
  title,
  description,
  status,
}: {
  title: ReactNode;
  description?: string;
  status: string;
}) {
  return (
    <PageContainer className="space-y-2 pt-6 pb-4 lg:pt-10 lg:pb-6">
      <h1 className="text-display text-balance [&_em]:text-primary-text [&_em]:not-italic">
        {title}
      </h1>
      {description && (
        <p className="text-body text-text-secondary">{description}</p>
      )}
      <p role="status" className="sr-only">
        {status}
      </p>
    </PageContainer>
  );
}
