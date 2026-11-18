'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  type FavoriteHospital,
  favoriteMutations,
  favoriteQueries,
} from '@/features/favorites/queries';
import { errorMessageKey } from '@/lib/api/error-message';
import { cn } from '@/lib/utils';

import { FavoriteCard } from './favorite-card';
import { FavoriteListSkeleton } from './favorite-list-skeleton';

type Notice = { id: number; text: string };

export function FavoriteList() {
  const t = useTranslations('library.favorites');
  const tCommon = useTranslations('common.actions');
  const tErrors = useTranslations('errors');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const favorites = useQuery(favoriteQueries.list());
  const [notice, setNotice] = useState<Notice | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const toggle = favoriteMutations.toggle();
  /** 연달아 빼면 mutate별 콜백은 마지막 것만 불리므로 옵션 단계에서 결과를 받는다. 되돌리기(onError)는 그대로 둔다. */
  const remove = useMutation({
    ...toggle,
    onError: (error, variables, result, context) => {
      void toggle.onError?.(error, variables, result, context);
      setFailure(`${t('removeFailed')} ${tErrors(errorMessageKey(error))}`);
    },
  });

  function handleRemove(favorite: FavoriteHospital) {
    setFailure(null);
    remove.mutate({ ykiho: favorite.ykiho, isFavorite: false });
    const text = t('removed', {
      name: favorite.name ?? t('unavailableName'),
    });
    setNotice((previous) => ({ id: (previous?.id ?? 0) + 1, text }));
    headingRef.current?.focus();
  }

  if (favorites.isPending) return <FavoriteListSkeleton />;

  if (favorites.isError) {
    return (
      <EmptyState
        icon={<Heart />}
        title={t('errorTitle')}
        description={tErrors(errorMessageKey(favorites.error))}
        action={
          <Button
            variant="outline"
            size="md"
            isLoading={favorites.isRefetching}
            onClick={() => void favorites.refetch()}
          >
            {tCommon('retry')}
          </Button>
        }
      />
    );
  }

  return (
    <section aria-labelledby="favorites-heading" className="pt-4 lg:pt-0">
      <h2
        id="favorites-heading"
        ref={headingRef}
        tabIndex={-1}
        className={cn(
          'text-subheading outline-none',
          favorites.data.length === 0 && 'sr-only',
        )}
      >
        {t('count', { count: favorites.data.length })}
      </h2>
      {failure && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-danger-tint px-4 py-3 text-body-sm text-danger"
        >
          {failure}
        </p>
      )}
      {favorites.data.length === 0 ? (
        <EmptyState
          icon={<Heart />}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          action={
            <Button asChild size="md">
              <Link href="/search?type=hospital">{t('browse')}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="mt-3 flex flex-col gap-3 lg:mt-4 lg:gap-4">
          {favorites.data.map((favorite) => (
            <li key={favorite.ykiho}>
              <FavoriteCard
                favorite={favorite}
                onRemove={() => handleRemove(favorite)}
              />
            </li>
          ))}
        </ul>
      )}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {notice && <p key={notice.id}>{notice.text}</p>}
      </div>
    </section>
  );
}
