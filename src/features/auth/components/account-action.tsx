'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { openLoginDialog } from '../login-dialog-store';
import { displayName, useSession } from '../use-session';
import { UserAvatar } from './user-avatar';

/** 헤더 오른쪽의 로그인 버튼 또는 내 정보 링크. 확인 중에는 같은 높이의 자리를 잡아 헤더가 흔들리지 않게 한다. compact는 모바일 상단 바용이다. */
export function AccountAction({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('auth.account');
  const { status, user } = useSession();

  if (status === 'pending') {
    return (
      <span role="status" className="inline-flex">
        <Skeleton className={cn('h-9 rounded-lg', compact ? 'w-16' : 'w-20')} />
        <span className="sr-only">{t('checking')}</span>
      </span>
    );
  }

  if (!user) {
    return (
      <Button
        size="sm"
        variant={compact ? 'tint' : 'primary'}
        onClick={() => openLoginDialog()}
      >
        {t('login')}
      </Button>
    );
  }

  const name = displayName(user);
  if (compact) {
    return (
      <Link
        href="/my"
        aria-label={t('openMy', { name })}
        className="touch-target relative rounded-full active:opacity-80"
      >
        <UserAvatar name={name} className="size-9 text-label-bold lg:size-9" />
      </Link>
    );
  }

  return (
    <Button asChild size="sm" variant="neutral" className="max-w-50">
      <Link href="/my" aria-label={t('openMy', { name })}>
        <span className="truncate">{t('greeting', { name })}</span>
      </Link>
    </Button>
  );
}
