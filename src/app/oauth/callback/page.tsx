import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { BrandLink } from '@/components/layout/brand-link';
import { PageContainer } from '@/components/layout/page-container';

import { OAuthCallback } from './_components/oauth-callback';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.callback');
  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
  };
}

/** 백엔드가 토큰을 fragment로 넘겨 돌려보내는 화면. 셸 밖에 두어 다른 스크립트와 화면 조각을 싣지 않는다. */
export default async function OAuthCallbackPage() {
  const t = await getTranslations('auth.callback');
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-top-bar items-center border-b border-hairline lg:h-top-nav">
        <PageContainer>
          <BrandLink />
        </PageContainer>
      </header>
      <main
        id="main"
        className="flex flex-1 items-center justify-center py-section px-page"
      >
        <h1 className="sr-only">{t('metaTitle')}</h1>
        <OAuthCallback />
      </main>
    </div>
  );
}
