import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { MyHome } from './_components/my-home';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('my') };
}

export default function MyPage() {
  return <MyHome />;
}
