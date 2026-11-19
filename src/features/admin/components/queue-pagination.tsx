'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

export function QueuePagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const t = useTranslations('admin.queue');
  return (
    <nav
      aria-label={t('pagination')}
      className="flex flex-wrap items-center justify-between gap-2 pt-1"
    >
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft aria-hidden="true" />
        {t('prev')}
      </Button>
      <p className="text-body-sm text-text-secondary tabular-nums">
        {t('pageStatus', { page, total: totalPages })}
      </p>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        {t('next')}
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
}
