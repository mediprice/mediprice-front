import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SubTopBar } from '@/components/layout/sub-top-bar';
import { ClientMessages } from '@/i18n/client-messages';

import { LocationTermsDocument } from './_components/location-terms-document';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal.locationTerms');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: '/location-terms' },
  };
}

export default async function LocationTermsPage() {
  const t = await getTranslations('legal.locationTerms');
  return (
    <ClientMessages namespaces={['legal.document']}>
      <SubTopBar title={t('title')} backHref="/" />
      <LocationTermsDocument />
    </ClientMessages>
  );
}
