'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
} from '@/components/layout/breadcrumb';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { LoginRequired } from '@/features/auth/components/login-required';
import { MyPageHeader } from '@/features/auth/components/my-page-header';
import { MyPageTitle } from '@/features/auth/components/my-page-title';
import { MySideNav } from '@/features/auth/components/my-side-nav';
import { medicalProfileQueries } from '@/features/medical-profile/queries';
import { errorMessageKey } from '@/lib/api/error-message';

import { ProfileForm } from './profile-form';

export function MedicalProfileView() {
  const t = useTranslations('library.medicalProfile');
  const tNav = useTranslations('nav');
  return (
    <>
      <MyPageHeader>
        <Breadcrumb>
          <BreadcrumbLink href="/my">{tNav('my')}</BreadcrumbLink>
          <BreadcrumbCurrent>{t('title')}</BreadcrumbCurrent>
        </Breadcrumb>
        <MyPageTitle
          id="medical-profile-title"
          title={t('heading')}
          description={t('description')}
        />
      </MyPageHeader>
      <PageContainer className="pb-section md:max-w-2xl lg:grid lg:max-w-page lg:grid-cols-[14rem_1fr] lg:items-start lg:gap-10">
        <MySideNav />
        <div className="min-w-0 lg:max-w-3xl">
          <LoginRequired reason="medicalProfile" fallback={<ProfileSkeleton />}>
            <ProfileLoader />
          </LoginRequired>
        </div>
      </PageContainer>
    </>
  );
}

function ProfileLoader() {
  const t = useTranslations('library.medicalProfile');
  const tCommon = useTranslations('common.actions');
  const tErrors = useTranslations('errors');
  const profile = useQuery(medicalProfileQueries.mine());

  if (profile.isPending) return <ProfileSkeleton />;
  if (profile.isError) {
    return (
      <EmptyState
        icon={<Activity />}
        title={t('errorTitle')}
        description={tErrors(errorMessageKey(profile.error))}
        action={
          <Button
            variant="tint"
            size="md"
            isLoading={profile.isRefetching}
            onClick={() => void profile.refetch()}
          >
            {tCommon('retry')}
          </Button>
        }
      />
    );
  }
  return <ProfileForm profile={profile.data} />;
}

function ProfileSkeleton() {
  const t = useTranslations('common.status');
  return (
    <div role="status" className="flex flex-col gap-8">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-13 w-full rounded-xl md:w-44" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <span className="sr-only">{t('loading')}</span>
    </div>
  );
}
