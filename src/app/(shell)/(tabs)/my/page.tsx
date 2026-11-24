import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ClientMessages } from '@/i18n/client-messages';

import { MyHome } from './_components/my-home';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('my') };
}

export default function MyPage() {
  return (
    <ClientMessages namespaces={['mypage.home', 'mypage.menu']}>
      <MyHome />
    </ClientMessages>
  );
}
