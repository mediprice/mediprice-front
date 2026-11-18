import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { SectionHeader } from '@/components/ui/section-header';

/** Figma "07 신뢰 안내". 수치(항목·병원 수)는 백엔드에 통계 API가 생기면 추가한다. */
export function TrustSection() {
  const t = useTranslations('home.trust');
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
      </PageContainer>
    </section>
  );
}
