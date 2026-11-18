import { CalendarDays, Info, Landmark } from 'lucide-react';
import { useTranslations } from 'next-intl';

/** 가격 출처와 읽는 법. 항목·병원 수 같은 통계는 백엔드에 통계 API가 생기면 더한다(docs 14장). */
export function TrustSection() {
  const t = useTranslations('home.trust');
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
