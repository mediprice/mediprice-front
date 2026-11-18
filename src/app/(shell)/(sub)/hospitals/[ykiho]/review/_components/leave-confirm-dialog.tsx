'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { CenteredDialogContent } from '@/features/auth/components/centered-dialog-content';

export function LeaveConfirmDialog({
  open,
  onLeave,
  onStay,
}: {
  open: boolean;
  onLeave: () => void;
  onStay: () => void;
}) {
  const t = useTranslations('reviews.leave');
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onStay();
      }}
    >
      <CenteredDialogContent title={t('title')}>
        <div className="flex flex-col gap-4">
          <p className="text-body-sm text-text-secondary">{t('description')}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="tint" size="md" onClick={onLeave}>
              {t('leave')}
            </Button>
            <Button size="md" onClick={onStay}>
              {t('stay')}
            </Button>
          </div>
        </div>
      </CenteredDialogContent>
    </ResponsiveDialog>
  );
}
