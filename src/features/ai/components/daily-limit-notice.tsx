import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { AI_DAILY_LIMIT } from '@/features/ai/usage-limits';
import { openLoginDialog } from '@/features/auth/login-dialog-store';

/** 오늘 한도를 다 썼을 때. 새 대화도 같은 한도를 쓰므로 비회원은 로그인을, 회원은 일반 검색을 tint 하나로 앞세운다. */
export function DailyLimitNotice({ isMember }: { isMember: boolean }) {
  const t = useTranslations('ai.limit');
  const categoryHref = { pathname: '/search', query: { category: 'all' } };
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="flex w-full items-center gap-3 text-caption-strong text-text-tertiary before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
        {t('title')}
      </p>
      <p className="text-body-sm text-text-secondary">
        {isMember
          ? t('member')
          : t('anonymous', { count: AI_DAILY_LIMIT.member })}
      </p>
      <div className="flex flex-col items-center gap-1">
        {isMember ? (
          <Button asChild variant="tint" size="md">
            <Link href={categoryHref}>{t('category')}</Link>
          </Button>
        ) : (
          <>
            <Button
              variant="tint"
              size="md"
              onClick={() => openLoginDialog({ reason: 'ai' })}
            >
              {t('login', { count: AI_DAILY_LIMIT.member })}
            </Button>
            <Button asChild variant="ghost" size="md">
              <Link href={categoryHref}>{t('category')}</Link>
            </Button>
          </>
        )}
        <Button asChild variant="ghost" size="md">
          <Link href="/search">{t('search')}</Link>
        </Button>
      </div>
    </div>
  );
}
