import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ImageResponse } from 'next/og';
import { createTranslator } from 'next-intl';

import metadata from '@/i18n/messages/ko/metadata.json';

import { BRAND_COLORS, BrandTile } from './_components/brand-tile';

const t = createTranslator({
  locale: 'ko',
  messages: { metadata },
  namespace: 'metadata',
});

export const alt = t('ogImage.alt');
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const FONT_DIR = join(
  process.cwd(),
  'node_modules/pretendard/dist/public/static',
);

/** 빌드 때 한 번 그린다. 글꼴을 못 읽으면 기본 글꼴로 그려 빌드가 멈추지 않게 한다. */
async function loadPretendard() {
  try {
    const [bold, medium] = await Promise.all([
      readFile(join(FONT_DIR, 'Pretendard-Bold.otf')),
      readFile(join(FONT_DIR, 'Pretendard-Medium.otf')),
    ]);
    return [
      { name: 'Pretendard', data: bold, weight: 700 as const },
      { name: 'Pretendard', data: medium, weight: 500 as const },
    ];
  } catch {
    return undefined;
  }
}

export default async function OpengraphImage() {
  const fonts = await loadPretendard();
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 80,
        background: BRAND_COLORS.bg,
        color: BRAND_COLORS.textPrimary,
        fontFamily: fonts ? 'Pretendard' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <BrandTile size={72} />
        <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -0.5 }}>
          {t('title')}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <span
          style={{
            maxWidth: 940,
            fontSize: 80,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: -2,
            wordBreak: 'keep-all',
          }}
        >
          {t('ogImage.headline')}
        </span>
        <span
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: BRAND_COLORS.textSecondary,
          }}
        >
          {t('ogImage.caption')}
        </span>
      </div>
    </div>,
    { ...size, fonts },
  );
}
