import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';

const STEPS = ['find', 'compare', 'decide'] as const;

/** 이용 순서 3단계. 그림은 실제 입력창으로 오해하지 않도록 기기 화면 안의 장식으로 그린다. */
export function HowItWorks() {
  const t = useTranslations('home.howItWorks');

  return (
    <section aria-labelledby="home-how">
      <PageContainer className="grid grid-cols-1 gap-6 py-section lg:grid-cols-2 lg:items-center lg:gap-16 [&>*]:min-w-0">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-caption-bold text-primary-text">
              {t('eyebrow')}
            </p>
            <h2 id="home-how" className="text-section">
              {t('title')}
            </h2>
          </div>
          <ol className="space-y-5">
            {STEPS.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-tint text-caption-bold text-primary-text"
                >
                  {index + 1}
                </span>
                <span className="space-y-0.5">
                  <span className="block text-label-bold">
                    {t(`steps.${step}.title`)}
                  </span>
                  <span className="block text-body-sm text-text-secondary">
                    {t(`steps.${step}.description`)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none order-first flex justify-center rounded-xl bg-surface px-4 pt-6 select-none lg:order-none lg:px-12 lg:pt-10"
        >
          <div className="w-full max-w-72 rounded-t-4xl border-8 border-b-0 border-text-primary bg-bg px-4 pt-6 pb-4">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-surface-strong" />
            <div className="flex h-10 items-center gap-2 rounded-lg bg-surface px-3 text-body-sm text-text-secondary">
              <Search className="size-4 shrink-0" strokeWidth={1.75} />
              {t('demo.query')}
            </div>
            <ul className="mt-2 space-y-1">
              {(['suggestion1', 'suggestion2', 'suggestion3'] as const).map(
                (key) => (
                  <li
                    key={key}
                    className="flex h-9 items-center rounded-md px-2.5 text-body-sm first:bg-primary-tint first:text-primary-text"
                  >
                    {t(`demo.${key}`)}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
