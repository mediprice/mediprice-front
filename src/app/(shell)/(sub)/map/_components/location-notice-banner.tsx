'use client';

import { Info, X } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import type { ServiceRegion } from '@/features/regions/service-region';

import { itemListHref } from './item-list-href';
import type { LocationNotice } from './use-map-search';

const TITLE_KEY = {
  denied: 'deniedTitle',
  unavailable: 'unavailableTitle',
  outside: 'outsideTitle',
} as const;
const DESCRIPTION_KEY = {
  denied: 'deniedDescription',
  unavailable: 'unavailableDescription',
  outside: 'outsideDescription',
} as const;

/** 위치를 못 쓸 때 지역 중심으로 보여 준다는 안내. 항목이 있으면 지역 목록(S-06)으로 돌아갈 수 있다. */
export function LocationNoticeBanner({
  notice,
  item,
  region,
  back,
  isRetrying,
  onRetry,
  onDismiss,
}: {
  notice: LocationNotice;
  item: string | null;
  region: ServiceRegion;
  /** 항목 가격 화면의 필터 쿼리. 목록으로 돌아갈 때 쓴다. */
  back: string | null;
  isRetrying: boolean;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const t = useTranslations('map.location');
  const place = t(region === 'gyeonggi' ? 'place.gyeonggi' : 'place.seoul');

  return (
    <div role="status" className="border-b border-hairline bg-bg py-3 px-page">
      <div className="flex gap-3 rounded-xl bg-warning-tint p-4">
        <Info
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-warning"
          strokeWidth={1.75}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-label-bold text-text-primary">
            {t(TITLE_KEY[notice])}
          </p>
          <p className="text-body-sm text-text-secondary">
            {t(DESCRIPTION_KEY[notice], { place })}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {notice !== 'outside' && (
              <Button
                variant="onTint"
                size="sm"
                isLoading={isRetrying}
                onClick={onRetry}
              >
                {t('retry')}
              </Button>
            )}
            {item && (
              <Button asChild variant="ghost" size="sm">
                <Link href={itemListHref(item, region, back)}>
                  {t('backToList')}
                </Link>
              </Button>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label={t('dismiss')}
          onClick={onDismiss}
          className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg/60"
        >
          <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
