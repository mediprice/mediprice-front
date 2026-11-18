import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

export default function Home() {
  const t = useTranslations();
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl space-y-6">
        <h1 className="text-hero">{t('common.brand')}</h1>
        <a
          className={cn(
            'inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-label-bold text-on-primary shadow-cta-glow',
            'hover:bg-primary-hover active:bg-primary-pressed',
          )}
          href="https://nextjs.org/docs"
          target="_blank"
          rel="noreferrer"
        >
          {t('home.docsLink')} <ArrowRight aria-hidden="true" size={18} />
        </a>
      </div>
    </main>
  );
}
