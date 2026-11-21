/** globals.css 토큰 값. ImageResponse(satori)는 CSS 변수를 읽지 못해 hex로 옮겨 둔다. 토큰을 바꾸면 함께 바꾼다. */
export const BRAND_COLORS = {
  primary: '#016cbf',
  primaryTint: '#e6f2ff',
  onPrimary: '#ffffff',
  bg: '#ffffff',
  textPrimary: '#0f2d5b',
  textSecondary: '#4a5b6c',
} as const;

/** lucide Tag 아이콘의 path. ImageResponse 안에서는 lucide 컴포넌트 대신 SVG를 직접 그린다(점은 satori가 r=0.5 원의 획을 링으로 그려 채운 원으로 바꿨다). */
const TAG_PATH =
  'M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z';

/** BrandLink의 심볼(파란 둥근 타일 + 가격표)을 ImageResponse용으로 그린다. 비율은 28px 타일·16px 글리프·12px 모서리를 따른다. */
export function BrandTile({
  size,
  isSquare = false,
}: {
  size: number;
  /** apple-icon처럼 OS가 모서리를 깎는 곳은 꽉 찬 사각형으로 둔다. */
  isSquare?: boolean;
}) {
  const glyph = Math.round((size * 16) / 28);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: isSquare ? 0 : Math.round((size * 12) / 28),
        background: BRAND_COLORS.primary,
      }}
    >
      <svg
        width={glyph}
        height={glyph}
        viewBox="0 0 24 24"
        fill="none"
        stroke={BRAND_COLORS.onPrimary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={TAG_PATH} />
        <circle
          cx="7.5"
          cy="7.5"
          r="1.5"
          fill={BRAND_COLORS.onPrimary}
          stroke="none"
        />
      </svg>
    </div>
  );
}
