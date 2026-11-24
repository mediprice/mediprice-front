import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ClientMessages } from '@/i18n/client-messages';

import { FavoritesView } from './_components/favorites-view';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('library.favorites');
  return { title: t('title') };
}

/** S-12 관심. 찜한 병원 목록(백엔드는 병원만 찜할 수 있다). */
export default function FavoritesPage() {
  return (
    <ClientMessages namespaces={['library.favorites', 'mypage.menu']}>
      <FavoritesView />
    </ClientMessages>
  );
}
