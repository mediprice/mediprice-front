import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { SubTopBar } from '@/components/layout/sub-top-bar';
import { AdminNav } from '@/features/admin/components/admin-nav';

/** 운영자 확인 뒤에만 그리는 틀(모바일 위 바와 탭). 소비자 화면의 비교함·바닥글은 두지 않는다. */
export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations('admin.header');
  return (
    <>
      <SubTopBar title={t('label')} backHref="/my" />
      <PageContainer className="pt-2 lg:pt-6">
        <AdminNav />
      </PageContainer>
      <PageContainer className="flex flex-1 flex-col gap-8 pt-6 pb-section lg:pt-8">
        {children}
      </PageContainer>
    </>
  );
}
