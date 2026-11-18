import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { openLoginDialog } from '@/features/auth/login-dialog-store';

import { AI_DAILY_LIMIT } from '../usage-limits';

/** 오늘 한도를 다 썼을 때. 새 대화도 같은 한도를 쓰므로 새 대화 대신 로그인(비회원)이나 일반 검색(회원)으로 안내한다. */
export function DailyLimitNotice({ isMember }: { isMember: boolean }) {
  const t = useTranslations('ai.limit');
  const links = (
    <>
      <Button asChild variant="outline" size="md">
        <Link href={{ pathname: '/search', query: { category: 'all' } }}>
          {t('category')}
        </Link>
      </Button>
      <Button asChild variant="outline" size="md">
        <Link href="/search">{t('search')}</Link>
      </Button>
    </>
  );
  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-3 text-caption-strong text-text-tertiary before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
        {t('title')}
      </p>
      <p className="text-center text-body-sm text-text-secondary">
        {isMember
          ? t('member')
          : t('anonymous', { count: AI_DAILY_LIMIT.member })}
      </p>
      <div className="flex flex-col gap-2 lg:flex-row lg:justify-center">
        {!isMember && (
          <Button size="md" onClick={() => openLoginDialog({ reason: 'ai' })}>
            {t('login', { count: AI_DAILY_LIMIT.member })}
          </Button>
        )}
        {links}
      </div>
    </div>
  );
}
