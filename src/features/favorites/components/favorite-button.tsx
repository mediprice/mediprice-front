'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useLoginGuard, useSession } from '@/features/auth/use-session';
import { savePendingFavorite } from '@/features/favorites/pending-favorite';
import {
  favoriteMutations,
  favoriteQueries,
  type FavoriteSeed,
  isFavoriteIn,
} from '@/features/favorites/queries';
import { cn } from '@/lib/utils';

type Notice = { id: number; kind: 'added' | 'removed' | 'failed' };

/**
 * 병원 관심(찜) 토글. 상태는 바뀌는 접근성 이름("○○ 관심 추가" / "○○ 관심 병원에서 빼기")과 채운 하트로 알린다.
 * 이름이 행동을 말하므로 aria-pressed는 쓰지 않는다(둘을 함께 쓰면 "빼기, 눌림"처럼 겹쳐 읽힌다). 로그인하지 않았으면 로그인 다이얼로그를 연다.
 * 하트 상태는 찜 목록 캐시(favoriteQueries.list)에서 읽으므로 화면에 여러 개를 두어도 목록 요청은 한 번이다.
 */
export function FavoriteButton({
  ykiho,
  hospital,
  variant = 'icon',
  onError,
  onToggle,
  className,
}: {
  ykiho: string;
  /** 접근성 이름과 관심 화면의 낙관적 표시에 쓴다. */
  hospital?: FavoriteSeed;
  /** icon: 44px 하트만(카드). labeled: "관심 추가/관심 병원" 버튼(병원 상세, 비교함 담기 옆). */
  variant?: 'icon' | 'labeled';
  /** 실패를 화면에 따로 알리고 싶을 때. 하트는 이미 원래대로 돌아가 있다. */
  onError?: (error: Error) => void;
  /** 부모가 변경을 직접 처리할 때(관심 화면의 되돌리기처럼 카드가 사라져도 결과를 받아야 할 때). 주면 버튼은 요청을 보내지 않는다. */
  onToggle?: (isFavorite: boolean) => void;
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
  /** 캐시에 목록이 있어도 세션 확인 전(서버 렌더·hydration 중)에는 쓰지 않아 서버 HTML과 어긋나지 않게 한다. */
  const isPressed = toggle.isPending
    ? toggle.variables.isFavorite
    : isSignedIn && isSaved;
  const isBusy = isSignedIn && (isListPending || toggle.isPending);
  const name = hospital?.name?.trim();
  const label = isPressed
    ? name
      ? t('removeLabelNamed', { name })
      : t('removeLabel')
    : name
      ? t('addLabelNamed', { name })
      : t('addLabel');

  const guardedToggle = guard('favorite', () => {
    if (isBusy) return;
    const isFavorite = !isPressed;
    if (onToggle) {
      onToggle(isFavorite);
      return;
    }
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

  /** 로그인하지 않았으면 로그인하고 돌아왔을 때 이어서 넣도록 남긴다(PendingFavoriteRunner가 실행한다). */
  function handleClick() {
    if (status === 'anonymous' && !isPressed && !onToggle) {
      savePendingFavorite({
        ykiho,
        name: name ?? null,
        path: window.location.pathname + window.location.search,
        scrollY: window.scrollY,
      });
    }
    guardedToggle();
  }

  return (
    <>
      <Button
        variant={variant === 'icon' ? 'ghost' : isPressed ? 'tint' : 'outline'}
        size={variant === 'icon' ? 'icon' : 'sm'}
        aria-label={label}
        aria-busy={isBusy || undefined}
        data-slot="favorite-button"
        data-pressed={isPressed}
        onClick={handleClick}
        className={cn(
          'z-10',
          variant === 'icon' &&
            'text-text-tertiary hover:bg-surface data-[pressed=true]:text-primary',
          variant === 'labeled' && isPressed && 'text-primary-text',
          className,
        )}
      >
        <Heart
          aria-hidden="true"
          fill={isPressed ? 'currentColor' : 'none'}
          className={cn(variant === 'icon' && 'size-6!')}
        />
        {variant === 'labeled' && (
          <span aria-hidden="true">{isPressed ? t('added') : t('add')}</span>
        )}
      </Button>
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {notice && <span key={notice.id}>{t(`notice.${notice.kind}`)}</span>}
      </span>
    </>
  );
}
