import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { LoginRequired } from '@/features/auth/components/login-required';
import { MySideNav } from '@/features/auth/components/my-side-nav';
import { MySubPageHeader } from '@/features/auth/components/my-sub-page-header';

import { MyReviewList } from './my-review-list';

export function MyReviewsView() {
  const t = useTranslations('reviews.my');
  return (
    <>
      <MySubPageHeader title={t('title')} description={t('description')} />
      <PageContainer className="pt-4 pb-section md:max-w-2xl lg:grid lg:max-w-page lg:grid-cols-[14rem_1fr] lg:items-start lg:gap-8 lg:pt-0">
        <MySideNav />
        <LoginRequired reason="myReviews">
          <MyReviewList />
        </LoginRequired>
      </PageContainer>
    </>
  );
}
