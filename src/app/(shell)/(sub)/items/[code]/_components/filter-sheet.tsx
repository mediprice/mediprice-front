'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogTrigger,
} from '@/components/ui/responsive-dialog';

import { FilterPanel } from './filter-panel';
import { clearConditions, type PriceFilters } from './price-filters';
import { useApplyFilters } from './use-apply-filters';

/** 모바일 필터 시트. 고른 값은 적용을 누를 때까지 임시로 두고, 열 때마다 URL 값으로 다시 시작한다. */
export function FilterSheet({
  code,
  filters,
  trigger,
}: {
  code: string;
  filters: PriceFilters;
  trigger: ReactNode;
}) {
  const t = useTranslations('items.filters');
  const tActions = useTranslations('common.actions');
  const applyFilters = useApplyFilters(code);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(filters);

  function handleOpenChange(open: boolean) {
    if (open) setDraft(filters);
    setIsOpen(open);
  }

  function handleApply() {
    applyFilters(draft);
    setIsOpen(false);
  }

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={handleOpenChange}>
      <ResponsiveDialogTrigger asChild>{trigger}</ResponsiveDialogTrigger>
      <ResponsiveDialogContent
        title={t('title')}
        description={t('sheetDescription')}
        footer={
          <>
            <Button
              variant="tint"
              size="lg"
              className="min-w-fit flex-1"
              onClick={() => setDraft(clearConditions(draft))}
            >
              {tActions('reset')}
            </Button>
            <Button
              size="lg"
              className="min-w-fit flex-1"
              onClick={handleApply}
            >
              {tActions('apply')}
            </Button>
          </>
        }
      >
        <FilterPanel value={draft} onChange={setDraft} />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
