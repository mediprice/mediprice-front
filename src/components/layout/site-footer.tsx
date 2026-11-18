import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

import { PageContainer } from './page-container';

/** className은 하단 탭바 높이만큼 아래 여백을 줄 때 쓴다(회색 바탕이 끝까지 이어지게). */
export function SiteFooter({ className }: { className?: string }) {
  const t = useTranslations('common.footer');
  return (
    <footer className={cn('border-t border-hairline bg-surface', className)}>
      <PageContainer className="space-y-2 py-8">
        <p className="text-label-bold text-text-primary">{t('source')}</p>
        <p className="text-body-sm text-text-secondary">{t('notice')}</p>
        <p className="text-caption text-text-tertiary">{t('copyright')}</p>
      </PageContainer>
    </footer>
  );
}
