import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SubTopBar } from '@/components/layout/sub-top-bar';
import { ClientMessages } from '@/i18n/client-messages';

import { HistoryView } from './_components/history-view';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('library.history');
  return { title: t('title') };
}

/** S-13 최근 기록. 비교·AI 요약 기록은 백엔드가 없어 "최근 본" 기록만 보여 준다. */
export default async function HistoryPage() {
  const t = await getTranslations('library.history');
  return (
    <ClientMessages namespaces={['library.history', 'mypage.menu']}>
      <SubTopBar title={t('title')} backHref="/my" />
      <HistoryView />
    </ClientMessages>
  );
}
