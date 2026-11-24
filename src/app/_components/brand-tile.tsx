import {
  BRAND_SYMBOL_LARGE_RATIO,
  BrandSymbol,
} from '@/components/ui/brand-symbol';

/** globals.css 토큰 값. ImageResponse(satori)는 CSS 변수를 읽지 못해 hex로 옮겨 둔다. 토큰을 바꾸면 함께 바꾼다. */
export const BRAND_COLORS = {
  primary: '#016cbf',
  primaryTint: '#e6f2ff',
  onPrimary: '#ffffff',
  bg: '#ffffff',
  textPrimary: '#0f2d5b',
  textSecondary: '#4a5b6c',
} as const;

/** 앱 아이콘(Figma Icons · icon-512·icon-192·apple-touch-icon): 흰 정사각형 가운데에 폭 60%의 심볼. */
export function AppIcon({ size }: { size: number }) {
  const width = size * 0.6;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        background: BRAND_COLORS.bg,
      }}
    >
      <BrandSymbol
        variant="large"
        idPrefix="app-icon"
        width={width}
        height={width / BRAND_SYMBOL_LARGE_RATIO}
      />
    </div>
  );
}

/** 탭 아이콘: 배경 없이 작은 크기용 심볼만. */
export function TabIcon({ size }: { size: number }) {
  return (
    <div style={{ display: 'flex', width: size, height: size }}>
      <BrandSymbol
        variant="small"
        idPrefix="tab-icon"
        width={size}
        height={size}
      />
    </div>
  );
}

/** 공유 이미지 머리의 심볼. 높이를 기준으로 폭을 맞춘다. */
export function OgSymbol({ height }: { height: number }) {
  return (
    <BrandSymbol
      variant="large"
      idPrefix="og"
      width={height * BRAND_SYMBOL_LARGE_RATIO}
      height={height}
    />
  );
}
