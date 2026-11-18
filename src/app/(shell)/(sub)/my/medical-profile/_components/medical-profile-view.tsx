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
import { MySideNav } from '@/features/auth/components/my-side-nav';
import { medicalProfileQueries } from '@/features/medical-profile/queries';
import { errorMessageKey } from '@/lib/api/error-message';

import { ProfileForm } from './profile-form';

export function MedicalProfileView() {
  const t = useTranslations('library.medicalProfile');
  const tNav = useTranslations('nav');
  return (
    <>
      <MyPageHeader className="max-lg:bg-none max-lg:[&>div]:pt-5 max-lg:[&>div]:pb-0">
        <Breadcrumb>
          <BreadcrumbLink href="/my">{tNav('my')}</BreadcrumbLink>
          <BreadcrumbCurrent>{t('title')}</BreadcrumbCurrent>
        </Breadcrumb>
        <h1
          id="medical-profile-title"
          tabIndex={-1}
          className="text-title outline-none"
        >
          <span className="lg:hidden">{t('heading')}</span>
          <span className="hidden lg:inline">{t('title')}</span>
        </h1>
        <p className="text-body-sm text-text-secondary">{t('description')}</p>
      </MyPageHeader>
      <PageContainer className="pt-4 pb-section lg:grid lg:grid-cols-[14rem_1fr] lg:items-start lg:gap-8 lg:pt-0">
        <MySideNav />
        <LoginRequired reason="medicalProfile" fallback={<ProfileSkeleton />}>
          <ProfileLoader />
        </LoginRequired>
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
            variant="outline"
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
    <div role="status" className="flex flex-col gap-4">
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-44 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <span className="sr-only">{t('loading')}</span>
    </div>
  );
}
