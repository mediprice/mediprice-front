import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { PageContainer } from '@/components/layout/page-container';
import { ConsentStep } from '@/features/auth/components/consent-step';
import { consentReturnPath } from '@/features/auth/required-consent';
import { ClientMessages } from '@/i18n/client-messages';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.consent');
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

/** 필수 동의 화면. 동의하기 전에는 다른 화면으로 가지 않도록 셸(내비게이션) 밖에 둔다. */
export default async function ConsentPage({
  searchParams,
}: PageProps<'/consent'>) {
  const [{ returnTo }, t] = await Promise.all([
    searchParams,
    getTranslations('common'),
  ]);
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-top-bar items-center border-b border-hairline lg:h-top-nav">
        <PageContainer className="max-w-2xl">
          <p className="text-subheading">{t('brand')}</p>
        </PageContainer>
      </header>
      <main id="main" className="flex-1 py-8 lg:py-section">
        <PageContainer className="max-w-2xl">
          <ClientMessages namespaces={['legal.document']}>
            <ConsentStep returnTo={consentReturnPath(returnTo)} />
          </ClientMessages>
        </PageContainer>
      </main>
    </div>
  );
}
