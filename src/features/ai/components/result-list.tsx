import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { Button } from '@/components/ui/button';

import type { TurnItem } from '../schemas';
import { ResultItemCard } from './result-item-card';

/** S-05 AI 후보 결과. 마지막 결과에만 이어 묻기·다시 찾기를 둔다. */
export function ResultList({
  items,
  actions,
}: {
  items: TurnItem[];
  actions?: { onAskMore: () => void; onRestart: () => void };
}) {
  const t = useTranslations('ai.result');
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2
          id={headingId}
          className="flex items-baseline justify-between gap-2 text-subheading"
        >
          {t('title')}
          <span className="text-label text-text-secondary">
            {t('count', { count: items.length })}
          </span>
        </h2>
        <p className="text-caption text-text-tertiary">{t('free')}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.code}>
            <ResultItemCard item={item} />
          </li>
        ))}
      </ul>
      <p className="flex gap-2 rounded-lg bg-hero px-4 py-3 text-body-sm text-text-secondary">
        <Info
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0"
          strokeWidth={1.75}
        />
        {t('notice')}
      </p>
      {actions && (
        <div className="grid grid-cols-2 gap-2 lg:flex">
          <Button variant="tint" size="md" onClick={actions.onAskMore}>
            {t('askMore')}
          </Button>
          <Button variant="outline" size="md" onClick={actions.onRestart}>
            {t('restart')}
          </Button>
        </div>
      )}
    </section>
  );
}
