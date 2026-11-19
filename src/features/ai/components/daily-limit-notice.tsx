import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { openLoginDialog } from '@/features/auth/login-dialog-store';

import { AI_DAILY_LIMIT } from '../usage-limits';

/** 오늘 한도를 다 썼을 때. 새 대화도 같은 한도를 쓰므로 비회원은 로그인을, 회원은 카테고리 찾기를 앞세운다. */
export function DailyLimitNotice({ isMember }: { isMember: boolean }) {
  const t = useTranslations('ai.limit');
  const categoryHref = { pathname: '/search', query: { category: 'all' } };
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface px-5 py-6 text-center">
      <h2 className="text-heading text-balance">{t('title')}</h2>
      <p className="max-w-md text-body text-text-secondary">
        {isMember
          ? t('member')
          : t('anonymous', { count: AI_DAILY_LIMIT.member })}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {isMember ? (
          <Button asChild size="md">
            <Link href={categoryHref}>{t('category')}</Link>
          </Button>
        ) : (
          <>
            <Button size="md" onClick={() => openLoginDialog({ reason: 'ai' })}>
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
