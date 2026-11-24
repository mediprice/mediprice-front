import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SubTopBar } from '@/components/layout/sub-top-bar';
import { ClientMessages } from '@/i18n/client-messages';

import { ReviewPolicyDocument } from './_components/review-policy-document';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal.reviewPolicy');
  return { title: t('metaTitle'), description: t('metaDescription') };
}

export default async function ReviewPolicyPage() {
  const t = await getTranslations('legal.reviewPolicy');
  return (
    <ClientMessages namespaces={['legal.document']}>
      <SubTopBar title={t('title')} backHref="/" />
      <ReviewPolicyDocument />
    </ClientMessages>
  );
}
