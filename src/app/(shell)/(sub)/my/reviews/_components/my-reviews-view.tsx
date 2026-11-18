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

import { MyReviewList } from './my-review-list';

export function MyReviewsView() {
  const t = useTranslations('reviews.my');
  const tNav = useTranslations('nav');
  return (
    <>
      <MyPageHeader className="max-lg:hidden">
        <Breadcrumb>
          <BreadcrumbLink href="/my">{tNav('my')}</BreadcrumbLink>
          <BreadcrumbCurrent>{t('title')}</BreadcrumbCurrent>
        </Breadcrumb>
        <h1 className="text-title">{t('title')}</h1>
        <p className="text-body-sm text-text-secondary">{t('description')}</p>
      </MyPageHeader>
      <h1 className="sr-only lg:hidden">{t('title')}</h1>
      <PageContainer className="pt-4 pb-section lg:grid lg:grid-cols-[14rem_1fr] lg:items-start lg:gap-8 lg:pt-0">
        <MySideNav />
        <LoginRequired>
          <MyReviewList />
        </LoginRequired>
      </PageContainer>
    </>
  );
}
