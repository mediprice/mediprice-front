import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

export default function Home() {
  const t = useTranslations();
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl space-y-6">
        <h1 className="text-hero">{t('common.brand')}</h1>
        <Button asChild>
          <a href="https://nextjs.org/docs" target="_blank" rel="noreferrer">
            {t('home.docsLink')}
            <ArrowRight aria-hidden="true" />
          </a>
        </Button>
      </div>
    </main>
  );
}
