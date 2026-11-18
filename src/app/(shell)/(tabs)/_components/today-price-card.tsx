'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { RollingNumber } from '@/components/ui/rolling-number';
import { RotationControls } from '@/components/ui/rotation-controls';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag } from '@/components/ui/tag';
import { POPULAR_ITEMS } from '@/features/npay/catalog';
import { PriceSpread } from '@/features/npay/components/price-spread';
import { npayQueries } from '@/features/npay/queries';
import { DEFAULT_REGION, sidoCodesOf } from '@/features/regions/service-region';
import { useRotation } from '@/lib/motion/use-rotation';

const INTERVAL_MS = 6000;

/**
 * 인기 항목 하나의 서울·경기 평균을 큰 숫자로 보여 주고 약 6초마다 다음 항목으로 넘긴다.
 * 카드 전체가 항목 화면 링크(제목 링크를 카드 크기로 늘림)이고, 멈춤·이전·다음 버튼은 그 위에 놓인다.
 */
export function TodayPriceCard() {
  const t = useTranslations('home.today');
  const tHome = useTranslations('home');
  const tRegion = useTranslations('common.region');
  const tPrice = useTranslations('common.price');
  const tActions = useTranslations('common.actions');
  const rotation = useRotation(POPULAR_ITEMS.length, INTERVAL_MS);
  const item = POPULAR_ITEMS[rotation.index] ?? POPULAR_ITEMS[0];
  const { data, isPending, isError, refetch } = useQuery(
    npayQueries.summaryIn(item.code, sidoCodesOf(DEFAULT_REGION)),
  );
  const average = data?.avgPrice ?? null;
  const itemName = tHome(`popular.items.${item.id}.name`);

  return (
    <section
      aria-labelledby="home-today"
      {...rotation.rootProps}
      className="relative flex min-w-0 flex-col rounded-3xl bg-surface p-5 transition-colors duration-200 ease-standard has-[a[data-card-link]:hover]:bg-surface-strong md:p-7 lg:p-8"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="home-today" className="text-label-bold text-primary-text">
          {t('title')}
        </h2>
        <Tag tone="onBand">{tHome(`categories.${item.category}`)}</Tag>
      </div>

      <div
        key={item.id}
        className="mt-4 flex min-h-54 animate-in flex-col duration-300 ease-standard fade-in"
      >
        <p className="text-heading text-balance">
          {t('label', { item: itemName, region: tRegion(DEFAULT_REGION) })}
        </p>

        {isPending ? (
          <div aria-hidden="true" className="mt-2 flex flex-col gap-4">
            <Skeleton className="h-12 w-56 max-w-full lg:h-16 lg:w-72" />
            <Skeleton className="my-0.5 h-4.75 w-72 max-w-full lg:h-5" />
            <Skeleton className="h-5.75 w-full" />
          </div>
        ) : isError ? (
          <div className="relative z-10 mt-4 flex flex-col items-start gap-3">
            <p className="text-body text-text-secondary">{t('error')}</p>
            <Button variant="outline" size="md" onClick={() => refetch()}>
              {tActions('retry')}
            </Button>
          </div>
        ) : average == null ? (
          <p className="mt-4 text-body text-text-tertiary">{tPrice('none')}</p>
        ) : (
          <div className="mt-2 flex flex-col gap-4">
            <p className="text-price-hero [overflow-wrap:anywhere]">
              <RollingNumber
                value={average}
                format={(value) => tPrice('won', { amount: value })}
              />
            </p>
            <PriceSpread min={data.minPrice} max={data.maxPrice} />
            <p className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <span className="text-body-sm text-text-secondary tabular-nums">
                {tPrice('hospitals', { count: data.hospitalCount })}
              </span>
              <span
                aria-hidden="true"
                className="inline-flex items-center gap-1 text-label-bold text-primary-text"
              >
                {t('detail')}
                <ArrowRight className="size-4" strokeWidth={2} />
              </span>
            </p>
          </div>
        )}
      </div>

      {/** 회전하는 내용은 transform 애니메이션이 있어 그 안에 늘린 링크를 두면 카드 밖으로 못 나간다. 그래서 카드 위에 따로 덮는다. */}
      <Link
        href={`/items/${item.code}`}
        aria-label={t('link', { item: itemName })}
        data-card-link
        className="absolute inset-0 rounded-3xl"
      />

      <div className="mt-4 flex justify-end border-t border-border pt-2">
        <RotationControls
          rotation={rotation}
          count={POPULAR_ITEMS.length}
          showPrev
          className="relative z-10 -mr-2 flex-wrap justify-end"
        />
      </div>
    </section>
  );
}
