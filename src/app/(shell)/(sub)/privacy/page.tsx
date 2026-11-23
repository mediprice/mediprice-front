import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SubTopBar } from '@/components/layout/sub-top-bar';

import { PrivacyDocument } from './_components/privacy-document';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal.privacy');
  return { title: t('metaTitle'), description: t('metaDescription') };
}

export default async function PrivacyPage() {
  const t = await getTranslations('legal.privacy');
  return (
    <>
      <SubTopBar title={t('title')} backHref="/" />
      <PrivacyDocument />
    </>
  );
}
