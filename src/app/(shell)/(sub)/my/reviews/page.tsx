import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SubTopBar } from '@/components/layout/sub-top-bar';
import { ClientMessages } from '@/i18n/client-messages';

import { MyReviewsView } from './_components/my-reviews-view';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('reviews.my');
  return { title: t('metaTitle') };
}

export default async function MyReviewsPage() {
  const t = await getTranslations('reviews.my');
  return (
    <ClientMessages
      namespaces={['reviews', 'claims', 'hospitals.detail', 'mypage.menu']}
    >
      <SubTopBar title={t('title')} backHref="/my" />
      <MyReviewsView />
    </ClientMessages>
  );
}
