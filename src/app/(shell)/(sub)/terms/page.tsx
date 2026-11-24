import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SubTopBar } from '@/components/layout/sub-top-bar';
import { ClientMessages } from '@/i18n/client-messages';

import { TermsDocument } from './_components/terms-document';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal.terms');
  return { title: t('metaTitle'), description: t('metaDescription') };
}

export default async function TermsPage() {
  const t = await getTranslations('legal.terms');
  return (
    <ClientMessages namespaces={['legal.document']}>
      <SubTopBar title={t('title')} backHref="/" />
      <TermsDocument />
    </ClientMessages>
  );
}
