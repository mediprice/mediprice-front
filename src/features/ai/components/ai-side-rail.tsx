import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { openLoginDialog } from '@/features/auth/login-dialog-store';
import type { SessionStatus } from '@/features/auth/use-session';

import { AI_DAILY_LIMIT } from '../usage-limits';

/** 데스크톱 오른쪽 열. 하루 한도와 AI 없이 찾는 길을 둔다. */
export function AiSideRail({
  sessionStatus,
  dailyRemaining,
}: {
  sessionStatus: SessionStatus;
  /** 마지막 응답의 오늘 남은 횟수. 아직 보낸 적이 없으면 null이다. */
  dailyRemaining: number | null;
}) {
  const t = useTranslations('ai');
  const isMember = sessionStatus === 'authenticated';
  return (
    <aside className="hidden w-85 shrink-0 flex-col gap-4 lg:flex">
      <section className="flex min-h-47 flex-col gap-2 rounded-xl bg-primary-tint px-6 py-5.5">
        <h2 className="text-label-bold">{t('usage.cardTitle')}</h2>
        {sessionStatus === 'pending' ? (
          <>
            <Skeleton className="h-8.5 w-32 bg-primary-tint-pressed" />
            <Skeleton className="h-5 w-56 bg-primary-tint-pressed" />
          </>
        ) : (
          <>
            <p className="text-title text-primary-text">
              {dailyRemaining !== null
                ? t('usage.remainingToday', { count: dailyRemaining })
                : t('usage.cardLimit', {
                    count: isMember
                      ? AI_DAILY_LIMIT.member
                      : AI_DAILY_LIMIT.anonymous,
                  })}
            </p>
            <p className="text-body-sm text-text-secondary">
              {isMember
                ? t('usage.cardMember')
                : t('usage.cardAnonymous', { count: AI_DAILY_LIMIT.member })}
            </p>
            {!isMember && (
              <Button
                size="sm"
                className="mt-1 w-fit"
                onClick={() => openLoginDialog({ reason: 'ai' })}
              >
                {t('usage.login')}
              </Button>
            )}
          </>
        )}
      </section>
      <section className="flex flex-col gap-3 rounded-xl bg-surface px-4 py-5">
        <h2 className="px-2 text-subheading">{t('rail.title')}</h2>
        <RailLink
          href={{ pathname: '/search', query: { category: 'all' } }}
          title={t('rail.category')}
          hint={t('rail.categoryHint')}
        />
        <RailLink
          href={{ pathname: '/search', query: { type: 'hospital' } }}
          title={t('rail.hospital')}
          hint={t('rail.hospitalHint')}
        />
      </section>
    </aside>
  );
}

function RailLink({
  href,
  title,
  hint,
}: {
  href: { pathname: string; query: Record<string, string> };
  title: ReactNode;
  hint: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg bg-bg px-3 py-2.5 transition-colors duration-150 ease-standard hover:bg-primary-tint"
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-label-bold">{title}</span>
        <span className="text-caption text-text-tertiary">{hint}</span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className="size-5 shrink-0 text-text-tertiary"
        strokeWidth={1.75}
      />
    </Link>
  );
}
