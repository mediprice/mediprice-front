'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
} from '@/components/layout/breadcrumb';
import { PageContainer } from '@/components/layout/page-container';
import { SubTopBar } from '@/components/layout/sub-top-bar';
import { MyPageHeader } from '@/features/auth/components/my-page-header';
import { ClaimPanel } from '@/features/claims/components/claim-panel';
import { hospitalQueries } from '@/features/hospitals/queries';
import { findCachedHospitalReview } from '@/features/reviews/cached-review';
import { RatingStars } from '@/features/reviews/components/rating-stars';

export function ClaimView({
  ykiho,
  reviewId,
}: {
  ykiho: string;
  reviewId: number;
}) {
  const t = useTranslations('claims.page');
  const tNav = useTranslations('nav');
  const format = useFormatter();
  const queryClient = useQueryClient();
  const hospital = useQuery(hospitalQueries.detail(ykiho));
  /** 병원 화면에서 넘어왔을 때만 후기 내용을 안다. 접수하면 목록이 다시 받아져 사라지므로 처음 값을 둔다. */
  const [review] = useState(() =>
    findCachedHospitalReview(queryClient, ykiho, reviewId),
  );
  const hospitalHref = `/hospitals/${encodeURIComponent(ykiho)}` as const;

  return (
    <>
      <SubTopBar title={t('title')} backHref={hospitalHref} />
      <MyPageHeader>
        <Breadcrumb>
          <BreadcrumbLink href="/">{tNav('home')}</BreadcrumbLink>
          {hospital.data && (
            <BreadcrumbLink href={hospitalHref}>
              {hospital.data.name}
            </BreadcrumbLink>
          )}
          <BreadcrumbCurrent>{t('title')}</BreadcrumbCurrent>
        </Breadcrumb>
        <h1 className="text-title">{t('title')}</h1>
        <p className="text-body-sm text-text-secondary">{t('intro')}</p>
        <p className="text-body-sm text-text-secondary">
          {t('memberReport')}{' '}
          <a
            href="/policy/reviews#temporary"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-0.5 text-primary-text underline underline-offset-4 hover:decoration-2"
          >
            {t('policyLink')}
            <ExternalLink
              aria-hidden="true"
              className="size-3.5 shrink-0"
              strokeWidth={1.75}
            />
            <span className="sr-only">{t('newTab')}</span>
          </a>
        </p>
      </MyPageHeader>
      <PageContainer className="flex flex-col gap-6 pt-6 pb-section md:max-w-2xl lg:max-w-page lg:pt-8 [&>*]:lg:max-w-3xl">
        <section
          aria-labelledby="claim-target-title"
          className="flex flex-col gap-2 rounded-xl bg-bg px-4 py-4 shadow-card max-[22rem]:px-3 lg:bg-surface lg:px-6 lg:shadow-none"
        >
          <h2
            id="claim-target-title"
            className="text-caption text-text-secondary"
          >
            {t('target')}
          </h2>
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-label-bold">
            <span>
              {hospital.data?.name ?? t('targetNumber', { id: reviewId })}
            </span>
            {hospital.data && (
              <span className="text-caption text-text-secondary tabular-nums">
                {t('targetNumber', { id: reviewId })}
              </span>
            )}
          </p>
          {review ? (
            <div className="flex flex-col gap-1.5">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm">
                <span className="text-label-bold">
                  {review.authorName ?? t('anonymous')}
                </span>
                <RatingStars
                  rating={review.rating}
                  label={t('rating', { rating: review.rating })}
                />
                <time
                  dateTime={review.createdAt}
                  className="text-caption text-text-secondary"
                >
                  {format.dateTime(new Date(review.createdAt), 'dateShort')}
                </time>
              </p>
              <p className="line-clamp-4 text-body-sm wrap-anywhere whitespace-pre-line">
                {review.content}
              </p>
            </div>
          ) : (
            <p className="text-body-sm text-text-secondary">
              {t('targetHint')}{' '}
              <Link
                href={`${hospitalHref}#reviews`}
                className="text-primary-text underline underline-offset-4 hover:decoration-2"
              >
                {t('openHospital')}
              </Link>
            </p>
          )}
        </section>
        <ClaimPanel reviewId={reviewId} backHref={hospitalHref} />
      </PageContainer>
    </>
  );
}
