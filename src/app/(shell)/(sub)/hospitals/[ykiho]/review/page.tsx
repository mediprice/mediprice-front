import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { decodeYkiho } from '@/features/hospitals/detail-links';
import { parseEditParam, parseFromParam } from '@/features/reviews/write-href';

import { ReviewWriteView } from './_components/review-write-view';

export async function generateMetadata({
  searchParams,
}: PageProps<'/hospitals/[ykiho]/review'>): Promise<Metadata> {
  const [{ edit }, t] = await Promise.all([
    searchParams,
    getTranslations('reviews.write'),
  ]);
  return {
    title: parseEditParam(edit) ? t('metaTitleEdit') : t('metaTitle'),
  };
}

export default async function ReviewWritePage({
  params,
  searchParams,
}: PageProps<'/hospitals/[ykiho]/review'>) {
  const [{ ykiho }, { edit, from }] = await Promise.all([params, searchParams]);
  const editId = parseEditParam(edit);
  return (
    <ReviewWriteView
      ykiho={decodeYkiho(ykiho)}
      editId={editId}
      from={editId ? parseFromParam(from) : 'hospital'}
    />
  );
}
