import { Info, MessageCirclePlus, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { Button } from '@/components/ui/button';

import type { AreaScope } from '../area-filters';
import type { TurnItem } from '../schemas';
import { type ItemDetail, ResultItemCard } from './result-item-card';
import { ResultItemCardSkeleton } from './result-item-card-skeleton';

/** S-05 AI 후보 결과. 이름을 아직 받는 중인 후보는 같은 모양의 자리로 둔다. 마지막 결과에만 이어 묻기·다시 찾기를 둔다. */
export function ResultList({
  entries,
  pendingCount,
  scope,
  actions,
}: {
  entries: { item: TurnItem; detail: ItemDetail }[];
  pendingCount: number;
  scope: AreaScope;
  actions?: { onAskMore: () => void; onRestart: () => void };
}) {
  const t = useTranslations('ai.result');
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-section">
          {pendingCount === 0
            ? t('titleWithCount', { count: entries.length })
            : t('title')}
        </h2>
        <p className="text-body-sm text-text-secondary">{t('free')}</p>
        {scope.kind === 'outside' && (
          <p className="text-body-sm text-text-secondary">
            {t('outsideArea', { area: scope.label })}
          </p>
        )}
      </div>
      <ul className="flex flex-col gap-3" aria-busy={pendingCount > 0}>
        {entries.map(({ item, detail }) => (
          <li
            key={item.code}
            className="transition-[opacity,translate] duration-300 ease-enter starting:translate-y-3 starting:opacity-0"
          >
            <ResultItemCard item={item} detail={detail} scope={scope} />
          </li>
        ))}
        {Array.from({ length: pendingCount }, (_, index) => (
          <li key={`pending-${index}`}>
            <ResultItemCardSkeleton />
          </li>
        ))}
      </ul>
      <p className="flex gap-2.5 rounded-2xl bg-surface px-4 py-3.5 text-body-sm text-text-secondary">
        <Info
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-text-tertiary"
          strokeWidth={1.75}
        />
        {t('notice')}
      </p>
      {actions && (
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button variant="tint" size="md" onClick={actions.onAskMore}>
            <MessageCirclePlus aria-hidden="true" />
            {t('askMore')}
          </Button>
          <Button variant="outline" size="md" onClick={actions.onRestart}>
            <RotateCcw aria-hidden="true" />
            {t('restart')}
          </Button>
        </div>
      )}
    </section>
  );
}
