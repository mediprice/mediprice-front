import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SubTopBar } from '@/components/layout/sub-top-bar';

import { MyReviewsView } from './_components/my-reviews-view';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('reviews.my');
  return { title: t('metaTitle') };
}

export default async function MyReviewsPage() {
  const t = await getTranslations('reviews.my');
  return (
    <>
      <SubTopBar title={t('title')} backHref="/my" />
      <MyReviewsView />
    </>
  );
}
