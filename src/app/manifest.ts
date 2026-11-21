import type { MetadataRoute } from 'next';
import { getTranslations } from 'next-intl/server';

import { BRAND_COLORS } from './_components/brand-tile';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({ locale: 'ko', namespace: 'metadata' });
  return {
    name: t('title'),
    short_name: t('title'),
    description: t('description'),
    lang: 'ko',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    /** 상단 바가 흰색이라 viewport themeColor와 같은 값을 쓴다. */
    theme_color: BRAND_COLORS.bg,
    background_color: BRAND_COLORS.bg,
    icons: [
      { src: '/icon/192', sizes: '192x192', type: 'image/png' },
      { src: '/icon/512', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
