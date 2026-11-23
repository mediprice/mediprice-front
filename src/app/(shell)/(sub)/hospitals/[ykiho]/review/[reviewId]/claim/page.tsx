import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { decodeYkiho } from '@/features/hospitals/detail-links';
import { parseReviewId } from '@/features/reviews/write-href';

import { ClaimView } from './_components/claim-view';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('claims.page');
  return { title: t('metaTitle') };
}

/** 양식과 수집·이용 안내가 길어 시트 대신 화면 하나로 둔다. 로그인 없이 들어올 수 있고 주소로 바로 열 수 있다. */
export default async function ReviewClaimPage({
  params,
}: PageProps<'/hospitals/[ykiho]/review/[reviewId]/claim'>) {
  const { ykiho, reviewId } = await params;
  const id = parseReviewId(reviewId);
  if (id === null) notFound();
  return <ClaimView ykiho={decodeYkiho(ykiho)} reviewId={id} />;
}
