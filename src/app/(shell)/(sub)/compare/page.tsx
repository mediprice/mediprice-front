import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SubTopBar } from '@/components/layout/sub-top-bar';
import { parseCompareParams } from '@/features/comparison/compare-params';

import { CompareView } from './_components/compare-view';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('comparison.page');
  return { title: t('metaTitle') };
}

/** 비교 대상은 주소(h 여러 개, item)가 기준이라 그대로 공유할 수 있다. 비교함은 이 주소를 만드는 도구다. */
export default async function ComparePage({
  searchParams,
}: PageProps<'/compare'>) {
  const [{ ykihos, item }, t] = await Promise.all([
    searchParams.then(parseCompareParams),
    getTranslations('comparison.page'),
  ]);

  return (
    <>
      <SubTopBar
        title={t('topBarTitle')}
        backHref={item ? `/items/${item}` : '/'}
      />
      <CompareView ykihos={ykihos} item={item} />
    </>
  );
}
