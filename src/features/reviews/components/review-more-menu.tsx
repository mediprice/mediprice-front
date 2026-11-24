'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ellipsis, Flag, PenLine, Scale, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type ReactNode, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from '@/components/ui/responsive-dialog';
import { useLoginGuard } from '@/features/auth/use-session';
import { claimNoticeState, claimQueries } from '@/features/claims/queries';
import { type Review, reviewKeys } from '@/features/reviews/queries';
import {
  reviewClaimHref,
  reviewWriteHref,
} from '@/features/reviews/write-href';

import { DeleteReviewDialog } from './delete-review-dialog';
import { preloadReportForm, ReportDialog } from './report-dialog';

type Action = 'edit' | 'delete' | 'report' | 'claim';

/** 후기의 수정·삭제(내 후기)와 신고·권리침해 신고(남의 후기). 모바일은 ⋯ 시트, 데스크톱은 카드 안의 작은 버튼이다. 권리침해 신고는 로그인 없이 쓰는 별도 화면이고, 서버에 기능이 없으면 숨긴다. */
export function ReviewMoreMenu({
  review,
  subject,
  from,
  onDeleted,
}: {
  review: Review;
  /** 버튼 이름에 붙일 대상(작성자 또는 병원 이름). 카드가 여러 개라 "신고"만으로는 어느 후기인지 알 수 없다. */
  subject: string;
  /** 수정을 마치고 돌아갈 화면. */
  from: 'hospital' | 'my';
  onDeleted?: () => void;
}) {
  const t = useTranslations('reviews.menu');
  const tClaim = useTranslations('claims.entry');
  const tActions = useTranslations('common.actions');
  const router = useRouter();
  const queryClient = useQueryClient();
  const guard = useLoginGuard();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  const inlineRef = useRef<HTMLDivElement>(null);
  const isDeletedRef = useRef(false);
  const notice = useQuery({
    ...claimQueries.notice(),
    enabled: !review.mine,
  });
  const canClaim =
    notice.data !== undefined &&
    claimNoticeState(notice.data) !== 'unsupported';
  const actions: Action[] = review.mine
    ? ['edit', 'delete']
    : canClaim
      ? ['report', 'claim']
      : ['report'];
  const claimHref = reviewClaimHref(review.ykiho, review.id);
  const openReport = guard('review', () => setIsReporting(true));

  function run(action: Action) {
    setIsMenuOpen(false);
    if (action === 'edit') {
      queryClient.setQueryData(reviewKeys.myReview(review.id), review);
      router.push(reviewWriteHref(review.ykiho, { edit: review.id, from }));
    } else if (action === 'delete') {
      setIsDeleting(true);
    } else if (action === 'report') {
      openReport();
    }
  }

  /** 시트를 닫고 연 다이얼로그라 Radix가 포커스를 돌려줄 곳을 몰라서, 지금 보이는 열기 버튼으로 돌려준다. */
  function restoreFocus(event: Event) {
    event.preventDefault();
    if (isDeletedRef.current) return;
    const inline = inlineRef.current?.querySelector('button');
    const target = moreRef.current?.offsetParent ? moreRef.current : inline;
    target?.focus();
  }

  const labels: Record<
    Action,
    { short: string; long: string; label: string; icon: ReactNode }
  > = {
    edit: {
      short: t('edit'),
      long: t('editLong'),
      label: t('editFor', { name: subject }),
      icon: <PenLine aria-hidden="true" />,
    },
    delete: {
      short: t('delete'),
      long: t('deleteLong'),
      label: t('deleteFor', { name: subject }),
      icon: <Trash2 aria-hidden="true" />,
    },
    report: {
      short: t('report'),
      long: t('reportLong'),
      label: t('reportFor', { name: subject }),
      icon: <Flag aria-hidden="true" />,
    },
    claim: {
      short: tClaim('short'),
      long: tClaim('long'),
      label: tClaim('labelFor', { name: subject }),
      icon: <Scale aria-hidden="true" />,
    },
  };

  return (
    <>
      <Button
        ref={moreRef}
        variant="ghost"
        size="icon"
        aria-label={t('openFor', { name: subject })}
        aria-haspopup="dialog"
        onClick={() => {
          if (!review.mine) preloadReportForm();
          setIsMenuOpen(true);
        }}
        className="-my-2 -mr-3 text-text-secondary lg:hidden"
      >
        <Ellipsis aria-hidden="true" />
      </Button>
      <div ref={inlineRef} className="-my-2 hidden items-center gap-1 lg:flex">
        {actions.map((action) =>
          action === 'claim' ? (
            <Button
              key={action}
              asChild
              variant="ghost"
              size="sm"
              className="text-text-secondary hover:bg-surface-strong active:bg-surface-strong"
            >
              <Link href={claimHref} aria-label={labels.claim.label}>
                {labels.claim.icon}
                {labels.claim.short}
              </Link>
            </Button>
          ) : (
            <Button
              key={action}
              variant={action === 'edit' ? 'tint' : 'ghost'}
              size="sm"
              aria-label={labels[action].label}
              onClick={() => run(action)}
              onPointerEnter={
                action === 'report' ? preloadReportForm : undefined
              }
              onFocus={action === 'report' ? preloadReportForm : undefined}
              className={
                action === 'edit'
                  ? undefined
                  : action === 'delete'
                    ? 'text-danger hover:bg-danger-tint active:bg-danger-tint'
                    : 'text-text-secondary hover:bg-surface-strong active:bg-surface-strong'
              }
            >
              {labels[action].icon}
              {labels[action].short}
            </Button>
          ),
        )}
      </div>

      <ResponsiveDialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <ResponsiveDialogContent title={t('title')}>
          <div className="flex flex-col gap-2">
            {actions.map((action) =>
              action === 'claim' ? (
                <Button
                  key={action}
                  asChild
                  variant="neutral"
                  size="lg"
                  className="w-full"
                >
                  <Link href={claimHref}>{labels.claim.long}</Link>
                </Button>
              ) : (
                <Button
                  key={action}
                  variant={action === 'delete' ? 'dangerText' : 'neutral'}
                  size="lg"
                  onClick={() => run(action)}
                  className="w-full"
                >
                  {labels[action].long}
                </Button>
              ),
            )}
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setIsMenuOpen(false)}
              className="w-full text-text-secondary"
            >
              {tActions('cancel')}
            </Button>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {review.mine ? (
        <DeleteReviewDialog
          reviewId={review.id}
          open={isDeleting}
          onOpenChange={setIsDeleting}
          onDeleted={() => {
            isDeletedRef.current = true;
            onDeleted?.();
          }}
          onCloseAutoFocus={restoreFocus}
        />
      ) : (
        <ReportDialog
          review={review}
          open={isReporting}
          onOpenChange={setIsReporting}
          onCloseAutoFocus={restoreFocus}
        />
      )}
    </>
  );
}
