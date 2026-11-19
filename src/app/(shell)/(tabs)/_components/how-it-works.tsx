import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeader } from '@/components/ui/section-header';

const STEPS = ['find', 'compare', 'decide'] as const;
const STEP_DELAY_MS = 120;

/** 이용 순서 3단계. 큰 번호와 짧은 문장만 두고, 스크롤로 처음 보일 때 차례로 떠오른다. */
export function HowItWorks() {
  const t = useTranslations('home.howItWorks');
  return (
    <section aria-labelledby="home-how">
      <PageContainer className="space-y-6 py-section lg:space-y-8">
        <SectionHeader id="home-how" title={t('title')} />
        <ol className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, index) => (
            <Reveal asChild key={step} delayMs={index * STEP_DELAY_MS}>
              <li className="flex gap-4 border-t border-border pt-5 md:flex-col md:gap-3">
                <span
                  aria-hidden="true"
                  className="w-10 shrink-0 text-price-xl text-primary-text md:w-auto"
                >
                  {index + 1}
                </span>
                <span className="space-y-1">
                  <span className="block text-heading">
                    {t(`steps.${step}.title`)}
                  </span>
                  <span className="block text-body text-text-secondary">
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
