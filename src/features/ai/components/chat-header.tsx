import { RotateCcw, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

/** 제목·새 대화와, 모바일에서만 오늘 남은 횟수(모르면 하루 한도). 데스크톱은 오른쪽 열 카드 한 곳에서만 보여 준다. */
export function ChatHeader({
  titleId,
  dailyLimit,
  dailyRemaining,
  onRestart,
}: {
  titleId: string;
  /** 로그인 상태를 확인하는 동안은 null이라 횟수를 숨긴다. */
  dailyLimit: number | null;
  /** 마지막 응답이 알려 준 오늘 남은 횟수. 있으면 한도 대신 보여 준다. */
  dailyRemaining: number | null;
  /** 대화가 있을 때만 넘긴다. */
  onRestart?: () => void;
}) {
  const t = useTranslations('ai');
  const usage =
    dailyLimit === null
      ? null
      : dailyRemaining !== null
        ? t('usage.remainingToday', { count: dailyRemaining })
        : t('usage.chip', { count: dailyLimit });
  return (
    <div className="@container py-2 px-page lg:px-8 lg:pt-5 lg:pb-1">
      <div className="flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1">
        <h1 id={titleId} className="min-w-0 grow basis-32 text-heading">
          {t('header.title')}
        </h1>
        {usage && (
          <p
            aria-label={
              dailyRemaining !== null || dailyLimit === null
                ? usage
                : t('usage.chipLabel', { count: dailyLimit })
            }
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary-tint py-1.5 pr-3 pl-2 text-caption-strong text-primary-text lg:hidden @max-xs:order-last"
          >
            <Sparkles
              aria-hidden="true"
              className="size-4"
              strokeWidth={1.75}
            />
            {usage}
          </p>
        )}
        {onRestart && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('header.restart')}
            onClick={onRestart}
            className="-mr-2 shrink-0 lg:mr-0"
          >
            <RotateCcw aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
