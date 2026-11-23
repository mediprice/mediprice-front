import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { ReactNode } from 'react';

import { BRAND_COLORS, BrandTile } from './brand-tile';

const FONT_DIR = join(
  process.cwd(),
  'node_modules/pretendard/dist/public/static',
);

/** 글꼴을 못 읽으면 기본 글꼴로 그려 빌드·응답이 멈추지 않게 한다. */
export async function loadPretendard() {
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

/** 항목·병원 공유 이미지의 공통 틀. 위에 서비스 이름, 가운데 제목, 아래에 가격·출처 줄을 둔다. */
export function OgFrame({
  siteName,
  hasFont,
  eyebrow,
  title,
  children,
  footer,
}: {
  siteName: string;
  hasFont: boolean;
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  footer: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 72,
        background: BRAND_COLORS.bg,
        color: BRAND_COLORS.textPrimary,
        fontFamily: hasFont ? 'Pretendard' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <BrandTile size={60} />
        <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: -0.5 }}>
          {siteName}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {eyebrow && (
          <span
            style={{
              fontSize: 30,
              fontWeight: 500,
              color: BRAND_COLORS.textSecondary,
            }}
          >
            {eyebrow}
          </span>
        )}
        <span
          style={{
            maxWidth: 1050,
            fontSize: title.length > 18 ? 60 : 76,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: -1.5,
            wordBreak: 'keep-all',
          }}
        >
          {title}
        </span>
        {children}
      </div>
      <span
        style={{
          fontSize: 26,
          fontWeight: 500,
          color: BRAND_COLORS.textSecondary,
        }}
      >
        {footer}
      </span>
    </div>
  );
}

/** 가격 같은 강조 한 줄(연한 파란 띠). */
export function OgHighlight({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 20,
        alignSelf: 'flex-start',
        padding: '18px 28px',
        borderRadius: 20,
        background: BRAND_COLORS.primaryTint,
      }}
    >
      <span
        style={{
          fontSize: 30,
          fontWeight: 500,
          color: BRAND_COLORS.textSecondary,
        }}
      >
        {label}
      </span>
      <span
        style={{ fontSize: 54, fontWeight: 700, color: BRAND_COLORS.primary }}
      >
        {value}
      </span>
    </div>
  );
}
