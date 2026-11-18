import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';

export default function Home() {
  const t = useTranslations();
  return (
    <PageContainer className="space-y-6 py-section">
      <h1 className="text-hero">{t('common.brand')}</h1>
      <Button asChild elevated>
        <a href="https://nextjs.org/docs" target="_blank" rel="noreferrer">
          {t('home.docsLink')}
          <ArrowRight aria-hidden="true" />
        </a>
      </Button>
    </PageContainer>
  );
}
