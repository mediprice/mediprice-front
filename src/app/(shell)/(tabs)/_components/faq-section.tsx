import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';

const QUESTIONS = ['coverage', 'actualCost', 'aiAdvice', 'login'] as const;

/** JS 없이 동작하는 details/summary 아코디언. 첫 질문만 펼쳐 둔다. */
export function FaqSection() {
  const t = useTranslations('home.faq');
  return (
    <section aria-labelledby="home-faq">
      <PageContainer className="grid gap-4 py-section lg:grid-cols-[1fr_2fr] lg:gap-16">
        <h2 id="home-faq" className="text-section">
          {t('title')}
        </h2>
        <div className="border-t border-border">
          {QUESTIONS.map((id, index) => (
            <details
              key={id}
              open={index === 0}
              className="group border-b border-border"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-2 text-label [&::-webkit-details-marker]:hidden">
                {t(`${id}.question`)}
                <ChevronDown
                  aria-hidden="true"
                  className="size-5 shrink-0 text-text-tertiary transition-transform group-open:rotate-180"
                  strokeWidth={1.75}
                />
              </summary>
              <p className="pb-4 text-body-sm text-text-secondary">
                {t(`${id}.answer`)}
              </p>
            </details>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
