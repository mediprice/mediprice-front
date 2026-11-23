'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Fragment, useCallback, useRef, useState } from 'react';

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
import { FavoritesCompareBand } from './favorites-compare-band';
import { RemovedFavoriteRow } from './removed-favorite-row';

type Notice = { id: number; text: string };
/** 되돌릴 수 있게 잠깐 남겨 두는 뺀 병원과 원래 자리. 되돌리기 하나만 유지한다(새로 빼면 앞의 것은 확정). */
type PendingUndo = { favorite: FavoriteHospital; index: number };

export function FavoriteList() {
  const t = useTranslations('library.favorites');
  const tCommon = useTranslations('common.actions');
  const tErrors = useTranslations('errors');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const favorites = useQuery(favoriteQueries.list());
  const [notice, setNotice] = useState<Notice | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [undo, setUndo] = useState<PendingUndo | null>(null);
  const toggleOptions = favoriteMutations.toggle();
  /** 연달아 빼면 mutate별 콜백은 마지막 것만 불리므로 옵션 단계에서 결과를 받는다. 캐시 되돌리기(onError)는 그대로 둔다. */
  const toggle = useMutation({
    ...toggleOptions,
    onError: (error, variables, result, context) => {
      void toggleOptions.onError?.(error, variables, result, context);
      setUndo((current) =>
        current?.favorite.ykiho === variables.ykiho ? null : current,
      );
      const key = variables.isFavorite ? 'restoreFailed' : 'removeFailed';
      setFailure(t(key, { reason: tErrors(errorMessageKey(error)) }));
    },
  });
  const announce = (text: string) =>
    setNotice((previous) => ({ id: (previous?.id ?? 0) + 1, text }));
  const nameOf = (favorite: FavoriteHospital) =>
    favorite.name ?? t('unavailableName');

  function handleRemove(favorite: FavoriteHospital, index: number) {
    setFailure(null);
    setUndo({ favorite, index });
    toggle.mutate({ ykiho: favorite.ykiho, isFavorite: false });
    announce(t('removed', { name: nameOf(favorite) }));
  }

  function handleUndo({ favorite }: PendingUndo) {
    setFailure(null);
    setUndo(null);
    toggle.mutate({
      ykiho: favorite.ykiho,
      isFavorite: true,
      hospital: favorite,
    });
    announce(t('restored', { name: nameOf(favorite) }));
    headingRef.current?.focus();
  }

  const handleExpire = useCallback((hadFocus: boolean) => {
    setUndo(null);
    if (hadFocus) headingRef.current?.focus();
  }, []);

  if (favorites.isPending) return <FavoriteListSkeleton />;

  if (favorites.isError) {
    return (
      <EmptyState
        icon={<Heart />}
        className="rounded-xl bg-bg"
        title={t('errorTitle')}
        description={tErrors(errorMessageKey(favorites.error))}
        action={
          <Button
            variant="tint"
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

  const items = favorites.data;
  const undoRow =
    undo && !items.some((item) => item.ykiho === undo.favorite.ykiho)
      ? undo
      : null;
  const undoIndex = undoRow ? Math.min(undoRow.index, items.length) : -1;
  const renderUndo = (pending: PendingUndo) => (
    <li key={`removed-${pending.favorite.ykiho}`}>
      <RemovedFavoriteRow
        name={nameOf(pending.favorite)}
        onUndo={() => handleUndo(pending)}
        onExpire={handleExpire}
      />
    </li>
  );

  return (
    <section aria-labelledby="favorites-heading">
      <h2
        id="favorites-heading"
        ref={headingRef}
        tabIndex={-1}
        className={cn(
          'text-subheading outline-none',
          items.length === 0 && !undoRow && 'sr-only',
        )}
      >
        {t('count', { count: items.length })}
      </h2>
      {failure && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-danger-tint px-4 py-3 text-body-sm text-danger"
        >
          {failure}
        </p>
      )}
      <FavoritesCompareBand />
      {items.length === 0 && !undoRow ? (
        <EmptyState
          icon={<Heart />}
          className="rounded-xl bg-bg"
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          action={
            <Button asChild variant="tint" size="md">
              <Link href="/search?type=hospital">{t('browse')}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="mt-3 grid gap-3 md:grid-cols-2 lg:mt-4 lg:gap-4">
          {items.map((favorite, index) => (
            <Fragment key={favorite.ykiho}>
              {undoRow && index === undoIndex && renderUndo(undoRow)}
              <li>
                <FavoriteCard
                  favorite={favorite}
                  onRemove={() => handleRemove(favorite, index)}
                />
              </li>
            </Fragment>
          ))}
          {undoRow && undoIndex === items.length && renderUndo(undoRow)}
        </ul>
      )}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {notice && <p key={notice.id}>{notice.text}</p>}
      </div>
    </section>
  );
}
