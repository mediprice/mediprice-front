import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { decodeYkiho } from '@/features/hospitals/detail-links';
import { parseFromParam, parseReviewId } from '@/features/reviews/write-href';
import { ClientMessages } from '@/i18n/client-messages';

import { ReviewWriteView } from './_components/review-write-view';

export async function generateMetadata({
  searchParams,
}: PageProps<'/hospitals/[ykiho]/review'>): Promise<Metadata> {
  const [{ edit }, t] = await Promise.all([
    searchParams,
    getTranslations('reviews.write'),
  ]);
  return {
    title: parseReviewId(edit) ? t('metaTitleEdit') : t('metaTitle'),
  };
}

export default async function ReviewWritePage({
  params,
  searchParams,
}: PageProps<'/hospitals/[ykiho]/review'>) {
  const [{ ykiho }, { edit, from }] = await Promise.all([params, searchParams]);
  const editId = parseReviewId(edit);
  return (
    <ClientMessages
      namespaces={[
        'reviews.write',
        'reviews.form',
        'reviews.leave',
        'mypage.menu',
      ]}
    >
      <ReviewWriteView
        ykiho={decodeYkiho(ykiho)}
        editId={editId}
        from={editId ? parseFromParam(from) : 'hospital'}
      />
    </ClientMessages>
  );
}
