import { useTranslations } from 'next-intl';

import { PageContainer } from './page-container';

export function SiteFooter() {
  const t = useTranslations('common.footer');
  return (
    <footer className="border-t border-hairline bg-surface">
      <PageContainer className="space-y-2 py-8">
        <p className="text-label-bold text-text-primary">{t('source')}</p>
        <p className="text-body-sm text-text-secondary">{t('notice')}</p>
        <p className="text-caption text-text-tertiary">{t('copyright')}</p>
      </PageContainer>
    </footer>
  );
}
