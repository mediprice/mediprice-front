import { CalendarDays, Info, Landmark } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import type { SiteStats } from '@/server/api/home-data';

/** 가격 출처와 읽는 법, 지금 볼 수 있는 병원·항목·가격 수와 데이터 기준일. stats가 없으면(통계 API 장애·배포 전) 숫자 없이 그린다. */
export function TrustSection({ stats }: { stats: SiteStats | null }) {
  const t = useTranslations('home.trust');
  const format = useFormatter();
  return (
    <section
      aria-labelledby="home-trust"
      className="flex min-w-0 flex-col gap-6"
    >
      <h2 id="home-trust" className="text-section text-balance">
        {t('title')}
      </h2>
      <div className="flex flex-col gap-5 rounded-3xl bg-surface p-5 md:p-8">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-bg text-primary-text"
          >
            <Landmark className="size-7" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-label text-text-tertiary">{t('sourceLabel')}</p>
            <p className="text-heading">{t('source')}</p>
            <p className="text-body text-text-secondary">
              {t('sourceDescription')}
            </p>
          </div>
        </div>
        {stats && stats.hospitalCount > 0 && (
          <div className="@container flex flex-col gap-3 border-t border-border pt-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="text-label-bold">{t('stats.label')}</h3>
              {stats.dataDate && (
                <p className="text-body-sm text-text-tertiary tabular-nums">
                  {t('stats.dataDate', {
                    date: format.dateTime(new Date(stats.dataDate), 'date'),
                  })}
                </p>
              )}
            </div>
            <dl className="grid grid-cols-1 divide-y divide-hairline rounded-2xl bg-bg @min-[24rem]:grid-cols-3 @min-[24rem]:gap-3 @min-[24rem]:divide-y-0 @min-[24rem]:bg-transparent">
              {(
                [
                  ['hospitals', stats.hospitalCount],
                  ['items', stats.npayItemCount],
                  ['prices', stats.priceCount],
                ] as const
              ).map(([key, count]) => (
                <div
                  key={key}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-4 py-3 @min-[24rem]:flex-col-reverse @min-[24rem]:flex-nowrap @min-[24rem]:items-start @min-[24rem]:justify-end @min-[24rem]:rounded-2xl @min-[24rem]:bg-bg"
                >
                  <dt className="text-body-sm text-text-secondary">
                    {t(`stats.${key}`)}
                  </dt>
                  <dd className="text-price-md break-keep">
                    {t(`stats.${key}Value`, { count })}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        <ul className="space-y-3 border-t border-border pt-5 text-body text-text-secondary">
          <li className="flex items-start gap-3">
            <CalendarDays
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-text-tertiary"
              strokeWidth={1.75}
            />
            {t('notes.date')}
          </li>
          <li className="flex items-start gap-3">
            <Info
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-text-tertiary"
              strokeWidth={1.75}
            />
            {t('notes.actual')}
          </li>
        </ul>
      </div>
    </section>
  );
}
