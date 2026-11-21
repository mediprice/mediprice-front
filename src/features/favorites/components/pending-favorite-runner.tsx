'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { useSession } from '@/features/auth/use-session';
import { showToast } from '@/features/feedback/toast-store';

import { takePendingFavorite } from '../pending-favorite';
import { favoriteMutations, favoriteQueries, isFavoriteIn } from '../queries';

/**
 * 로그인하지 않은 채 관심을 눌러 로그인하고 돌아오면, 같은 화면에서 그 병원을 관심에 넣고 보던 위치로 돌려놓은 뒤 알린다.
 * 셸 레이아웃에 한 번만 둔다.
 */
export function PendingFavoriteRunner() {
  const t = useTranslations('library.favoriteButton');
  const { status } = useSession();
  const queryClient = useQueryClient();
  const { mutate } = useMutation(favoriteMutations.toggle());

  useEffect(() => {
    if (status !== 'authenticated') return;
    const pending = takePendingFavorite(
      window.location.pathname + window.location.search,
    );
    if (!pending) return;
    window.scrollTo({ top: pending.scrollY });
    void queryClient
      .fetchQuery(favoriteQueries.list())
      .then((favorites) => {
        if (isFavoriteIn(favorites, pending.ykiho)) {
          showToast(t('notice.added'));
          return;
        }
        mutate(
          {
            ykiho: pending.ykiho,
            isFavorite: true,
            hospital: pending.name
              ? {
                  name: pending.name,
                  className: null,
                  address: null,
                  phone: null,
                }
              : undefined,
          },
          {
            onSuccess: () => showToast(t('notice.added')),
            onError: () => showToast(t('notice.failed')),
          },
        );
      })
      .catch(() => showToast(t('notice.failed')));
  }, [status, queryClient, mutate, t]);

  return null;
}
