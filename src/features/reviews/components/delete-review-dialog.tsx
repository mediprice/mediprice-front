'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { CenteredDialogContent } from '@/features/auth/components/centered-dialog-content';
import { errorMessageKey } from '@/lib/api/error-message';

import { reviewMutations } from '../queries';

export function DeleteReviewDialog({
  reviewId,
  open,
  onOpenChange,
  onDeleted,
  onCloseAutoFocus,
}: {
  reviewId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
  onCloseAutoFocus?: (event: Event) => void;
}) {
  const t = useTranslations('reviews.delete');
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('common.actions');
  const queryClient = useQueryClient();
  const remove = useMutation(reviewMutations.remove(queryClient));

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (remove.isPending) return;
        if (!next) remove.reset();
        onOpenChange(next);
      }}
    >
      <CenteredDialogContent
        title={t('title')}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <div className="flex flex-col gap-4">
          <p className="flex items-start gap-2 rounded-lg bg-warning-tint px-4 py-3 text-body-sm text-text-primary">
            <TriangleAlert
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-warning"
              strokeWidth={1.75}
            />
            {t('description')}
          </p>
          {remove.isError && (
            <p role="alert" className="text-body-sm text-danger">
              {tErrors(errorMessageKey(remove.error))}
            </p>
          )}
          <div className="flex flex-wrap gap-2 *:flex-[1_1_8rem]">
            <Button
              variant="neutral"
              size="md"
              disabled={remove.isPending}
              onClick={() => onOpenChange(false)}
            >
              {tActions('cancel')}
            </Button>
            <Button
              variant="danger"
              size="md"
              isLoading={remove.isPending}
              onClick={() =>
                remove.mutate(reviewId, {
                  onSuccess: () => {
                    onOpenChange(false);
                    onDeleted?.();
                  },
                })
              }
            >
              {t('confirm')}
            </Button>
          </div>
        </div>
      </CenteredDialogContent>
    </ResponsiveDialog>
  );
}
