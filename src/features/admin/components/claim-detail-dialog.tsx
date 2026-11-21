'use client';

import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { useId } from 'react';

import { Button } from '@/components/ui/button';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from '@/components/ui/responsive-dialog';
import { RatingStars } from '@/features/reviews/components/rating-stars';

import type { AdminClaim, ClaimAction } from '../claim-api';
import {
  claimantRoleKey,
  claimReasonKey,
  isClaimActive,
} from '../claim-labels';
import { adminClaimQueries } from '../claim-queries';
import { reviewStatusKey } from '../report-labels';
import { ClaimNotifySection } from './claim-notify-section';
import { ClaimOutcomeChip } from './claim-outcome-chip';
import { ClaimResolveForm } from './claim-resolve-form';
import { DetailField } from './detail-field';

/** 권리침해 신고 한 건. 신청인 정보는 여기서만 보인다. 대기 중이면 아래에서 처리하고, 처리한 신고는 결과 안내를 기록한다. */
export function ClaimDetailDialog({
  claim,
  open,
  onOpenChange,
  onResolved,
  onCloseAutoFocus,
}: {
  claim: AdminClaim | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved: (claim: AdminClaim, action: ClaimAction) => void;
  onCloseAutoFocus?: (event: Event) => void;
}) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      {claim && (
        <ClaimDetailContent
          key={claim.id}
          initial={claim}
          isOpen={open}
          onResolved={onResolved}
          onCloseAutoFocus={onCloseAutoFocus}
        />
      )}
    </ResponsiveDialog>
  );
}

/** 목록에서 받은 신고를 먼저 보이고, 열려 있는 동안 최신 내용(재게시 요청·알림 기록)을 다시 받는다. */
function ClaimDetailContent({
  initial,
  isOpen,
  onResolved,
  onCloseAutoFocus,
}: {
  initial: AdminClaim;
  isOpen: boolean;
  onResolved: (claim: AdminClaim, action: ClaimAction) => void;
  onCloseAutoFocus?: (event: Event) => void;
}) {
  const t = useTranslations('admin.claims');
  const format = useFormatter();
  const formId = useId();
  const detail = useQuery({
    ...adminClaimQueries.detail(initial),
    enabled: isOpen,
  });
  const claim = detail.data ?? initial;
  const isActive = isClaimActive(claim);
  const { review } = claim;
  const dateTime = (value: string) =>
    format.dateTime(new Date(value), 'dateTime');

  return (
    <ResponsiveDialogContent
      title={t('detail.title', { id: claim.id })}
      onCloseAutoFocus={onCloseAutoFocus}
      className="md:max-w-2xl"
      footer={
        isActive && (
          <Button
            type="submit"
            form={formId}
            variant="primary"
            size="md"
            className="w-full md:ml-auto md:w-auto"
          >
            {t('resolve.submit')}
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-6">
        {detail.isError && (
          <p role="alert" className="text-body-sm text-danger">
            {t('detail.stale')}
          </p>
        )}
        <section aria-labelledby={`${formId}-claim`}>
          <h3 id={`${formId}-claim`} className="mb-2 text-subheading">
            {t('detail.claim')}
          </h3>
          <dl className="flex flex-col gap-2">
            <DetailField label={t('detail.reason')}>
              {t(`reason.${claimReasonKey(claim.reason)}`)}
            </DetailField>
            <DetailField label={t('detail.description')}>
              <span className="whitespace-pre-line">{claim.description}</span>
            </DetailField>
            <DetailField label={t('detail.receivedAt')}>
              {dateTime(claim.createdAt)}
            </DetailField>
            <DetailField label={t('detail.deadline')}>
              {dateTime(claim.temporaryUntil)}
            </DetailField>
            <DetailField label={t('detail.status')}>
              <ClaimOutcomeChip claim={claim} />
            </DetailField>
          </dl>
        </section>

        <section aria-labelledby={`${formId}-claimant`}>
          <h3 id={`${formId}-claimant`} className="mb-1 text-subheading">
            {t('detail.claimant')}
          </h3>
          <p className="mb-2 text-body-sm text-text-secondary">
            {t('detail.claimantHint')}
          </p>
          <dl className="flex flex-col gap-2">
            <DetailField label={t('detail.name')}>
              {claim.claimantName}
            </DetailField>
            <DetailField label={t('detail.email')}>
              <a
                href={`mailto:${claim.claimantEmail}`}
                className="text-primary-text underline underline-offset-4 hover:decoration-2"
              >
                {claim.claimantEmail}
              </a>
            </DetailField>
            <DetailField label={t('detail.role')}>
              {t(`role.${claimantRoleKey(claim.claimantRole)}`)}
            </DetailField>
            <DetailField label={t('detail.member')}>
              {claim.claimantUserId === null
                ? t('detail.guest')
                : t('detail.memberId', { id: claim.claimantUserId })}
            </DetailField>
            <DetailField label={t('detail.noticeVersion')}>
              {claim.privacyNoticeVersion}
            </DetailField>
          </dl>
        </section>

        <section aria-labelledby={`${formId}-review`}>
          <h3 id={`${formId}-review`} className="mb-2 text-subheading">
            {t('detail.review')}
          </h3>
          {review ? (
            <div className="flex flex-col gap-3">
              <dl className="flex flex-col gap-2">
                <DetailField label={t('detail.reviewId')}>
                  {t('detail.reviewNumber', { id: review.id })}
                </DetailField>
                <DetailField label={t('detail.author')}>
                  {review.authorId === null
                    ? t('detail.authorWithdrawn')
                    : t('detail.memberId', { id: review.authorId })}
                </DetailField>
                <DetailField label={t('detail.writtenAt')}>
                  {dateTime(review.createdAt)}
                </DetailField>
                <DetailField label={t('detail.reviewStatus')}>
                  {t(`reviewStatus.${reviewStatusKey(review.status)}`)}
                </DetailField>
              </dl>
              <div className="flex flex-col gap-2 rounded-xl bg-surface p-3">
                <RatingStars
                  rating={review.rating}
                  label={t('rating', { rating: review.rating })}
                />
                <p className="text-body wrap-anywhere whitespace-pre-line">
                  {review.content}
                </p>
              </div>
              <Link
                href={`/hospitals/${encodeURIComponent(review.ykiho)}`}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-11 w-fit items-center gap-1 rounded-md text-label text-primary-text hover:underline"
              >
                {t('detail.hospital')}
                <ExternalLink
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.75}
                />
                <span className="sr-only">{t('detail.hospitalHint')}</span>
              </Link>
            </div>
          ) : (
            <p className="text-body-sm text-text-secondary">
              {t('reviewDeleted')}
            </p>
          )}
        </section>

        <section aria-labelledby={`${formId}-objection`}>
          <h3 id={`${formId}-objection`} className="mb-2 text-subheading">
            {t('detail.objection')}
          </h3>
          {claim.objection === null ? (
            <p className="text-body-sm text-text-secondary">
              {t('detail.objectionNone')}
            </p>
          ) : (
            <dl className="flex flex-col gap-2">
              <DetailField label={t('detail.objection')}>
                <span className="whitespace-pre-line">{claim.objection}</span>
              </DetailField>
              {claim.objectedAt && (
                <DetailField label={t('detail.objectedAt')}>
                  {dateTime(claim.objectedAt)}
                </DetailField>
              )}
            </dl>
          )}
        </section>

        {isActive ? (
          <section aria-labelledby={`${formId}-resolve`}>
            <h3 id={`${formId}-resolve`} className="mb-3 text-subheading">
              {t('resolve.title')}
            </h3>
            <ClaimResolveForm
              claim={claim}
              formId={formId}
              onResolved={onResolved}
            />
          </section>
        ) : (
          <>
            <section aria-labelledby={`${formId}-resolution`}>
              <h3 id={`${formId}-resolution`} className="mb-2 text-subheading">
                {t('detail.resolution')}
              </h3>
              <dl className="flex flex-col gap-2">
                {claim.action && (
                  <DetailField label={t('detail.action')}>
                    {t(`resolve.actions.${claim.action}`)}
                  </DetailField>
                )}
                {claim.resolutionNote && (
                  <DetailField label={t('detail.note')}>
                    <span className="whitespace-pre-line">
                      {claim.resolutionNote}
                    </span>
                  </DetailField>
                )}
                {claim.resolvedBy !== null && (
                  <DetailField label={t('detail.resolvedBy')}>
                    {t('detail.memberId', { id: claim.resolvedBy })}
                  </DetailField>
                )}
                {claim.resolvedAt && (
                  <DetailField label={t('detail.resolvedAt')}>
                    {dateTime(claim.resolvedAt)}
                  </DetailField>
                )}
              </dl>
            </section>
            <ClaimNotifySection claim={claim} />
          </>
        )}
      </div>
    </ResponsiveDialogContent>
  );
}
