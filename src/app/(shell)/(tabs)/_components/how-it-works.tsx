import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeader } from '@/components/ui/section-header';

const STEPS = ['find', 'compare', 'decide'] as const;
const STEP_DELAY_MS = 120;

/** 이용 순서 3단계. 장식용 화면 그림 없이 번호와 설명만 보여 준다. */
export function HowItWorks() {
  const t = useTranslations('home.howItWorks');

  return (
    <section aria-labelledby="home-how">
      <PageContainer className="space-y-6 py-section">
        <SectionHeader id="home-how" title={t('title')} />
        <ol className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {STEPS.map((step, index) => (
            <Reveal asChild key={step} delayMs={index * STEP_DELAY_MS}>
              <li className="flex gap-3 md:flex-col">
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-tint text-label-bold text-primary-text"
                >
                  {index + 1}
                </span>
                <span className="space-y-1">
                  <span className="block text-subheading">
                    {t(`steps.${step}.title`)}
                  </span>
                  <span className="block text-body-sm text-text-secondary">
                    {t(`steps.${step}.description`)}
                  </span>
                </span>
              </li>
            </Reveal>
          ))}
        </ol>
      </PageContainer>
    </section>
  );
}
