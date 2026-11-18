'use client';

import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag } from '@/components/ui/tag';
import { npayQueries } from '@/features/npay/queries';
import { errorMessageKey } from '@/lib/api/error-message';

import { formatItemTitle } from './item-title';

export function ItemHeader({ code }: { code: string }) {
  const t = useTranslations('items.header');
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('common.actions');
  const { data, isPending, isError, error, refetch } = useQuery(
    npayQueries.detail(code),
  );

  return (
    <div className="flex flex-col gap-2.5">
      {isPending ? (
        <>
          <Skeleton className="h-7 w-24" />
          <h1 className="text-display">
            <span className="sr-only">{t('loading')}</span>
            <Skeleton className="h-9 w-48 lg:h-10" />
          </h1>
        </>
      ) : isError ? (
        <>
          <h1 className="text-display">{t('fallbackTitle')}</h1>
          <div className="flex flex-wrap items-center gap-2" role="alert">
            <p className="text-body-sm text-text-secondary">
              {tErrors(errorMessageKey(error))}
            </p>
            <Button variant="ghost" size="sm" onClick={() => void refetch()}>
              {tActions('retry')}
            </Button>
          </div>
        </>
      ) : (
        <>
          {data.mdivName && <Tag className="w-fit">{data.mdivName}</Tag>}
          <h1 id="item-title" className="text-display">
            {formatItemTitle(data)}
          </h1>
        </>
      )}
      <p className="flex items-center gap-1.5 text-body-sm text-text-tertiary">
        <Info
          aria-hidden="true"
          className="size-4 shrink-0"
          strokeWidth={1.75}
        />
        {t('source')}
      </p>
    </div>
  );
}
