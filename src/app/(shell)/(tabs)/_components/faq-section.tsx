import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

const QUESTIONS = ['coverage', 'actualCost', 'aiAdvice', 'login'] as const;

/** JS 없이 동작하는 details/summary 아코디언. 첫 질문만 펼쳐 둔다. */
export function FaqSection() {
  const t = useTranslations('home.faq');
  return (
    <section aria-labelledby="home-faq" className="flex min-w-0 flex-col gap-6">
      <h2 id="home-faq" className="text-section text-balance">
        {t('title')}
      </h2>
      <div className="border-t border-border">
        {QUESTIONS.map((id, index) => (
          <details
            key={id}
            open={index === 0}
            className="group border-b border-border"
          >
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-3 text-subheading transition-colors duration-200 ease-standard hover:text-primary-text [&::-webkit-details-marker]:hidden">
              {t(`${id}.question`)}
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 text-text-tertiary transition-transform duration-200 ease-standard group-open:rotate-180"
                strokeWidth={1.75}
              />
            </summary>
            <p className="pb-5 text-body text-text-secondary">
              {t(`${id}.answer`)}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
