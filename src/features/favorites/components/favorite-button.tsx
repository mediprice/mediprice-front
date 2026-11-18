'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useLoginGuard, useSession } from '@/features/auth/use-session';
import { cn } from '@/lib/utils';

import {
  favoriteMutations,
  favoriteQueries,
  type FavoriteSeed,
  isFavoriteIn,
} from '../queries';

type Notice = { id: number; kind: 'added' | 'removed' | 'failed' };

/**
 * 병원 찜 토글(하트, aria-pressed). 로그인하지 않았으면 로그인 다이얼로그를 연다.
 * 하트 상태는 찜 목록 캐시(favoriteQueries.list)에서 읽으므로 화면에 여러 개를 두어도 목록 요청은 한 번이다.
 */
export function FavoriteButton({
  ykiho,
  hospital,
  variant = 'icon',
  onError,
  className,
}: {
  ykiho: string;
  /** 접근성 이름("○○ 관심 병원에 저장")과 관심 화면의 낙관적 표시에 쓴다. */
  hospital?: FavoriteSeed;
  /** icon: 44px 하트만(카드·모바일). labeled: "저장/저장됨" 알약 버튼(병원 상세·데스크톱 카드). */
  variant?: 'icon' | 'labeled';
  /** 실패를 화면에 따로 알리고 싶을 때. 하트는 이미 원래대로 돌아가 있다. */
  onError?: (error: Error) => void;
  className?: string;
}) {
  const t = useTranslations('library.favoriteButton');
  const guard = useLoginGuard();
  const { status } = useSession();
  const isSignedIn = status === 'authenticated';
  const { data: isSaved = false, isPending: isListPending } = useQuery({
    ...favoriteQueries.list(),
    enabled: isSignedIn,
    select: (favorites) => isFavoriteIn(favorites, ykiho),
  });
  const [notice, setNotice] = useState<Notice | null>(null);
  const toggle = useMutation(favoriteMutations.toggle());
  const isPressed = toggle.isPending ? toggle.variables.isFavorite : isSaved;
  const isBusy = isSignedIn && (isListPending || toggle.isPending);
  const name = hospital?.name?.trim();

  const handleClick = guard('favorite', () => {
    if (isBusy) return;
    const isFavorite = !isPressed;
    toggle.mutate(
      { ykiho, isFavorite, hospital },
      {
        onSuccess: () =>
          setNotice((previous) => ({
            id: (previous?.id ?? 0) + 1,
            kind: isFavorite ? 'added' : 'removed',
          })),
        onError: (error) => {
          setNotice((previous) => ({
            id: (previous?.id ?? 0) + 1,
            kind: 'failed',
          }));
          onError?.(error);
        },
      },
    );
  });

  return (
    <>
      <Button
        variant={variant === 'icon' ? 'ghost' : 'tint'}
        size={variant === 'icon' ? 'icon' : 'sm'}
        aria-pressed={isPressed}
        aria-label={name ? t('labelNamed', { name }) : t('label')}
        aria-busy={isBusy || undefined}
        data-slot="favorite-button"
        onClick={handleClick}
        className={cn(
          'z-10',
          variant === 'icon'
            ? 'text-text-tertiary hover:bg-surface aria-pressed:text-primary'
            : 'rounded-full',
          className,
        )}
      >
        <Heart
          aria-hidden="true"
          fill={isPressed ? 'currentColor' : 'none'}
          className={cn(variant === 'icon' && 'size-6!')}
        />
        {variant === 'labeled' && (
          <span aria-hidden="true">{isPressed ? t('saved') : t('save')}</span>
        )}
      </Button>
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {notice && <span key={notice.id}>{t(`notice.${notice.kind}`)}</span>}
      </span>
    </>
  );
}
