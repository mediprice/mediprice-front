import Image from 'next/image';
import { useFormatter, useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { SectionHeader } from '@/components/ui/section-header';
import type { SiteStats } from '@/server/api/home-data';

/** Figma "07 신뢰 안내"와 지금 볼 수 있는 병원·항목·가격 수, 데이터 기준일. stats가 없으면(통계 API 장애·배포 전) 숫자 없이 그린다. */
export function TrustSection({ stats }: { stats: SiteStats | null }) {
  const t = useTranslations('home.trust');
  const format = useFormatter();
  return (
    <section aria-labelledby="home-trust" className="bg-surface">
      <PageContainer className="space-y-4 py-section lg:space-y-6">
        <SectionHeader id="home-trust" title={t('title')} />
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:gap-4 [&_li>span:last-child]:min-w-0 [&>li]:min-w-0">
          <li className="flex items-center gap-3 rounded-xl bg-bg p-4 shadow-card lg:p-6">
            <span className="relative size-15 shrink-0">
              <Image
                src="/illustrations/medical-price-document.svg"
                alt=""
                width={39}
                height={52}
                unoptimized
                className="absolute top-[6.31%] left-[15%] h-[86%] w-[64.87%]"
              />
              <Image
                src="/illustrations/verified-price-badge.svg"
                alt=""
                width={21}
                height={22}
                unoptimized
                className="absolute top-[59.51%] left-[56.28%] h-[35.87%] w-[35.39%]"
              />
            </span>
            <span className="space-y-1">
              <span className="block text-subheading">
                {t('official.title')}
              </span>
              <span className="block text-body-sm text-text-secondary">
                {t('official.description')}
              </span>
            </span>
          </li>
          <li className="flex items-center gap-3 rounded-xl bg-bg p-4 shadow-card lg:p-6">
            <Image
              src="/illustrations/source-date.svg"
              alt=""
              width={60}
              height={60}
              unoptimized
              className="size-15 shrink-0"
            />
            <span className="space-y-1">
              <span className="block text-subheading">{t('source.title')}</span>
              <span className="block text-body-sm text-text-secondary">
                {t('source.description')}
              </span>
            </span>
          </li>
        </ul>
        {stats && stats.hospitalCount > 0 && (
          <div className="@container space-y-3 rounded-xl bg-bg p-4 shadow-card lg:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="text-subheading">{t('stats.label')}</h3>
              {stats.dataDate && (
                <p className="text-caption text-text-tertiary tabular-nums">
                  {t('stats.dataDate', {
                    date: format.dateTime(new Date(stats.dataDate), 'date'),
                  })}
                </p>
              )}
            </div>
            <dl className="grid grid-cols-1 gap-2 @min-[24rem]:grid-cols-3">
              {(
                [
                  ['hospitals', stats.hospitalCount],
                  ['items', stats.npayItemCount],
                  ['prices', stats.priceCount],
                ] as const
              ).map(([key, count]) => (
                <div
                  key={key}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-lg bg-surface px-4 py-3 @min-[24rem]:flex-col-reverse @min-[24rem]:flex-nowrap @min-[24rem]:items-start @min-[24rem]:justify-end"
                >
                  <dt className="text-body-sm text-text-secondary">
                    {t(`stats.${key}`)}
                  </dt>
                  <dd className="text-price-md break-keep tabular-nums">
                    {t(`stats.${key}Value`, { count })}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </PageContainer>
    </section>
  );
}
