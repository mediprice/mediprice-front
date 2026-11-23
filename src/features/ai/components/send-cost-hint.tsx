import { useTranslations } from 'next-intl';

/** 오늘 쓸 수 있는 AI 횟수. 남은 횟수는 첫 답을 받아야 알고, 그 전에는 하루 한도를 알린다. 로그인 확인 중이면 둘 다 null이다. */
export type DailyUsage = { limit: number | null; remaining: number | null };

/** 칩처럼 누르면 바로 보내는 곳 옆에, 보내면 1회 쓴다는 것과 남은 횟수(모르면 하루 한도)를 알린다. */
export function SendCostHint({
  usage,
  isInstant,
}: {
  usage: DailyUsage;
  isInstant: boolean;
}) {
  const t = useTranslations('ai.usage');
  const count =
    usage.remaining !== null
      ? t('costRemaining', { count: usage.remaining })
      : usage.limit !== null
        ? t('costLimit', { count: usage.limit })
        : null;
  return (
    <>
      {isInstant ? t('costInstant') : t('costSend')}
      {count && ` ${count}`}
    </>
  );
}
