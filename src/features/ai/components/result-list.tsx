import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import type { AreaScope } from '@/features/ai/area-filters';
import type { TurnItem } from '@/features/ai/schemas';
import {
  DEFAULT_REGION,
  SERVICE_REGIONS,
  type ServiceRegion,
} from '@/features/regions/service-region';

import { type ItemDetail, ResultItemCard } from './result-item-card';

/** S-05 AI 후보 결과. 이름을 아직 받는 중인 후보는 같은 높이의 자리로 둔다. 마지막 결과에만 이어 묻기·다시 찾기를 둔다. 장소를 말하지 않았으면 기본 지역임을 알리고 지역을 바꾸게 한다. */
export function ResultList({
  entries,
  pendingCount,
  scope,
  onRegionChange,
  actions,
}: {
  entries: { item: TurnItem; detail: ItemDetail }[];
  pendingCount: number;
  scope: AreaScope;
  onRegionChange: (region: ServiceRegion) => void;
  actions?: { onAskMore: () => void; onRestart: () => void };
}) {
  const t = useTranslations('ai.result');
  const tRegion = useTranslations('common.region');
  const headingId = useId();
  const regionId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2
          id={headingId}
          className="flex items-baseline justify-between gap-2 text-subheading"
        >
          {t('title')}
          {pendingCount === 0 && (
            <span className="text-label text-text-secondary">
              {t('count', { count: entries.length })}
            </span>
          )}
        </h2>
        <p className="text-caption text-text-tertiary">{t('free')}</p>
        {scope.kind === 'outside' && (
          <p className="text-caption text-text-tertiary">
            {t('outsideArea', { area: scope.label })}
          </p>
        )}
      </div>
      {scope.kind === 'default' && (
        <div className="flex flex-col gap-2">
          <p id={regionId} className="text-body-sm text-text-secondary">
            {scope.filters.region === DEFAULT_REGION
              ? t('region.defaultNote', { region: tRegion(DEFAULT_REGION) })
              : t('region.label')}
          </p>
          <SegmentedControl
            name={regionId}
            aria-labelledby={regionId}
            value={scope.filters.region}
            options={SERVICE_REGIONS.map((value) => ({
              value,
              label: tRegion(value),
            }))}
            onValueChange={onRegionChange}
            className="lg:max-w-md"
          />
        </div>
      )}
      <ul className="flex flex-col gap-3" aria-busy={pendingCount > 0}>
        {entries.map(({ item, detail }) => (
          <li key={item.code}>
            <ResultItemCard item={item} detail={detail} scope={scope} />
          </li>
        ))}
        {Array.from({ length: pendingCount }, (_, index) => (
          <li key={`pending-${index}`}>
            <Skeleton className="h-72 w-full rounded-xl xl:h-50" />
          </li>
        ))}
      </ul>
      <p className="flex gap-2 rounded-lg bg-surface-strong px-4 py-3 text-body-sm text-text-secondary">
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
