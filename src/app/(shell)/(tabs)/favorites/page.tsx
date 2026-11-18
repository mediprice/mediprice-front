import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { PageContainer } from '@/components/layout/page-container';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('favorites') };
}

/** 화면 작업 전 탭 이동을 확인하기 위한 자리. 해당 화면을 만들 때 교체한다. */
export default function Page() {
  const t = useTranslations('nav');
  return (
    <PageContainer className="py-section">
      <h1 className="text-title">{t('favorites')}</h1>
    </PageContainer>
  );
}
