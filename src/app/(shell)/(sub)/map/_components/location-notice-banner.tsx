'use client';

import { Info, LocateFixed, X } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import type { ServiceRegion } from '@/features/regions/service-region';
import { cn } from '@/lib/utils';

import { itemListHref } from './item-list-href';
import type { LocationNotice } from './use-map-search';

const TITLE_KEY = {
  denied: 'deniedTitle',
  unavailable: 'unavailableTitle',
  outside: 'outsideTitle',
  deferred: 'deferredTitle',
} as const;
const DESCRIPTION_KEY = {
  denied: 'deniedDescription',
  unavailable: 'unavailableDescription',
  outside: 'outsideDescription',
  deferred: 'deferredDescription',
} as const;

/**
 * 현재 위치 대신 지역 중심으로 보여 준다는 안내. 항목이 있으면 가격 목록(S-06)으로 돌아갈 수 있다.
 * 거부는 브라우저가 기억해 다시 물어도 소용없으므로 버튼 대신 허용하는 방법을 쓴다.
 */
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
  const isDeferred = notice === 'deferred';

  return (
    <div role="status" className="border-b border-hairline bg-bg py-3 px-page">
      {/** 글자를 키우면(좁은 rem 폭) 아이콘을 빼고, 설명·버튼은 제목 줄 아래 전체 폭을 써서 낱말이 세로로 깨지지 않게 한다. */}
      <div
        className={cn(
          '@container flex flex-col gap-1 rounded-xl p-4',
          isDeferred ? 'bg-primary-tint' : 'bg-warning-tint',
        )}
      >
        <div className="flex items-start gap-3">
          <Info
            aria-hidden="true"
            className={cn(
              'mt-0.5 size-5 shrink-0 @max-[20rem]:hidden',
              isDeferred ? 'text-primary-text' : 'text-warning',
            )}
            strokeWidth={1.75}
          />
          <p className="min-w-0 flex-1 text-label-bold break-keep text-text-primary">
            {t(TITLE_KEY[notice], { place })}
          </p>
          <button
            type="button"
            aria-label={t('dismiss')}
            onClick={onDismiss}
            className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg/60"
          >
            <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex min-w-0 flex-col gap-1 @min-[20rem]:pl-8">
          <p className="text-body-sm break-keep text-text-secondary">
            {t(DESCRIPTION_KEY[notice], { place })}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(notice === 'unavailable' || isDeferred) && (
              <Button
                variant="onTint"
                size="sm"
                isLoading={isRetrying}
                onClick={onRetry}
              >
                {isDeferred && <LocateFixed aria-hidden="true" />}
                {t(isDeferred ? 'useLocation' : 'retry')}
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
      </div>
    </div>
  );
}
