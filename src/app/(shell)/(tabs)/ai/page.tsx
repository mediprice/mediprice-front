import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';

/** 화면 작업 전 탭 이동을 확인하기 위한 자리. 해당 화면을 만들 때 교체한다. */
export default function Page() {
  const t = useTranslations('nav');
  return (
    <PageContainer className="py-8 lg:pt-16 lg:pb-18">
      <h1 className="text-title">{t('ai')}</h1>
    </PageContainer>
  );
}
