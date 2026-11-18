'use client';

import { useTranslations } from 'next-intl';

import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
} from '@/components/layout/breadcrumb';
import { PageContainer } from '@/components/layout/page-container';
import { LoginRequired } from '@/features/auth/components/login-required';
import { MyPageHeader } from '@/features/auth/components/my-page-header';
import { MySideNav } from '@/features/auth/components/my-side-nav';

import { HistoryList } from './history-list';
import { HistoryListSkeleton } from './history-list-skeleton';

export function HistoryView() {
  const t = useTranslations('library.history');
  const tNav = useTranslations('nav');
  return (
    <>
      <MyPageHeader className="max-lg:bg-none max-lg:[&>div]:pt-4 max-lg:[&>div]:pb-0">
        <Breadcrumb>
          <BreadcrumbLink href="/my">{tNav('my')}</BreadcrumbLink>
          <BreadcrumbCurrent>{t('title')}</BreadcrumbCurrent>
        </Breadcrumb>
        <h1 className="sr-only text-title lg:not-sr-only">{t('title')}</h1>
        <p className="text-body-sm text-text-secondary">{t('description')}</p>
      </MyPageHeader>
      <PageContainer className="pt-4 pb-section lg:grid lg:grid-cols-[14rem_1fr] lg:items-start lg:gap-8 lg:pt-0">
        <MySideNav />
        <LoginRequired reason="history" fallback={<HistoryListSkeleton />}>
          <HistoryList />
        </LoginRequired>
      </PageContainer>
    </>
  );
}
