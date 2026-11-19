'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
} from '@/components/layout/breadcrumb';
import { PageContainer } from '@/components/layout/page-container';
import { SubTopBar } from '@/components/layout/sub-top-bar';
import { LoginRequired } from '@/features/auth/components/login-required';
import { MyPageHeader } from '@/features/auth/components/my-page-header';
import { MySideNav } from '@/features/auth/components/my-side-nav';
import { hospitalQueries } from '@/features/hospitals/queries';
import { setReviewNotice } from '@/features/reviews/review-notice';
import type { ReviewWriteFrom } from '@/features/reviews/write-href';

import { LeaveConfirmDialog } from './leave-confirm-dialog';
import { ReviewWriteBody } from './review-write-body';
import { useLeaveGuard } from './use-leave-guard';

export function ReviewWriteView({
  ykiho,
  editId,
  from,
}: {
  ykiho: string;
  editId: number | null;
  from: ReviewWriteFrom;
}) {
  const t = useTranslations('reviews.write');
  const tMenu = useTranslations('mypage.menu');
  const tNav = useTranslations('nav');
  const router = useRouter();
  const hospital = useQuery(hospitalQueries.detail(ykiho));
  const isMyContext = from === 'my';
  const [isDirty, setIsDirty] = useState(false);
  const leave = useLeaveGuard(isDirty);
  const hospitalHref = `/hospitals/${encodeURIComponent(ykiho)}` as const;
  const backHref = isMyContext ? ('/my/reviews' as const) : hospitalHref;
  const title = editId ? t('titleEdit') : t('title');

  return (
    <div onClickCapture={leave.handleClickCapture}>
      <SubTopBar title={title} backHref={backHref} />
      <MyPageHeader className="max-lg:hidden">
        {isMyContext ? (
          <Breadcrumb>
            <BreadcrumbLink href="/my">{tNav('my')}</BreadcrumbLink>
            <BreadcrumbLink href="/my/reviews">
              {tMenu('reviews')}
            </BreadcrumbLink>
            <BreadcrumbCurrent>{title}</BreadcrumbCurrent>
          </Breadcrumb>
        ) : (
          <Breadcrumb>
            <BreadcrumbLink href="/">{tNav('home')}</BreadcrumbLink>
            {hospital.data && (
              <BreadcrumbLink href={hospitalHref}>
                {hospital.data.name}
              </BreadcrumbLink>
            )}
            <BreadcrumbCurrent>{title}</BreadcrumbCurrent>
          </Breadcrumb>
        )}
        <h1 className="text-display">{title}</h1>
      </MyPageHeader>
      <h1 className="sr-only lg:hidden">{title}</h1>
      <PageContainer
        className={
          isMyContext
            ? 'pt-4 pb-section lg:grid lg:grid-cols-[14rem_1fr] lg:items-start lg:gap-8 lg:pt-0'
            : 'pt-4 pb-section md:max-w-2xl lg:max-w-page lg:pt-0 [&>*]:lg:max-w-3xl'
        }
      >
        {isMyContext && <MySideNav />}
        <LoginRequired reason="review">
          <ReviewWriteBody
            ykiho={ykiho}
            editId={editId}
            backHref={backHref}
            onDirtyChange={setIsDirty}
            onCancel={() => leave.requestLeave(backHref)}
            onSaved={() => {
              setIsDirty(false);
              setReviewNotice(
                isMyContext ? 'my' : ykiho,
                editId ? 'updated' : 'created',
              );
              router.replace(backHref);
            }}
          />
        </LoginRequired>
      </PageContainer>
      <LeaveConfirmDialog
        open={leave.pendingHref != null}
        onLeave={leave.confirmLeave}
        onStay={leave.cancelLeave}
      />
    </div>
  );
}
