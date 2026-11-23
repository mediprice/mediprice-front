import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SubTopBar } from '@/components/layout/sub-top-bar';

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
    <>
      <SubTopBar title={t('title')} backHref="/" />
      <LocationTermsDocument />
    </>
  );
}
