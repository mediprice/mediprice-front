import { Info } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';

/** Figma "07 신뢰 안내". 수치(항목·병원 수)는 백엔드에 통계 API가 생기면 추가한다. */
export function TrustSection() {
  const t = useTranslations('home.trust');
  return (
    <section aria-labelledby="home-trust" className="bg-surface">
      <PageContainer className="space-y-4 py-section lg:space-y-6">
        <div className="space-y-2">
          <p className="text-caption-bold text-primary-text">{t('eyebrow')}</p>
          <h2 id="home-trust" className="text-section">
            {t('title')}
          </h2>
        </div>
        <ul className="grid gap-3 lg:grid-cols-2 lg:gap-4">
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
        <p className="flex items-start gap-1.5 text-caption text-text-tertiary">
          <Info
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={1.5}
          />
          {t('sourceLine')}
        </p>
      </PageContainer>
    </section>
  );
}
