import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

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
export default function OAuthCallbackPage() {
  return (
    <main
      id="main"
      className="flex min-h-dvh items-center justify-center bg-surface py-section px-page"
    >
      <OAuthCallback />
    </main>
  );
}
