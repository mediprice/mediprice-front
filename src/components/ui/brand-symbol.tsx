import type { ComponentProps } from 'react';

const HOLE_COLOR = '#016CBF';

/** Figma 03 Logo · Symbol v2. small은 v2/size16~64(작은 크기용 광학 보정), large는 lockup/symbol·icon-512와 같은 모양이다. */
const SYMBOLS = {
  small: {
    viewBox: '0 0 64 64',
    left: 'M4 26.2666C4 21.2 5.55556 16.6666 8.66667 12.6666C11.7778 8.66664 15.1244 8.45775 18.7067 12.04L29.3333 22.6666C31.1111 24.4444 31.1111 26.2222 29.3333 28L28.5533 28.78C27.2956 30.0378 26.6667 31.5555 26.6667 33.3333V60C26.6667 60.8889 26.2222 61.3333 25.3333 61.3333H13.1067C10.5911 61.3333 8.44444 60.4444 6.66667 58.6666C4.88889 56.8889 4 54.7422 4 52.2266V26.2666Z',
    right:
      'M60 26.2666C60 21.2 58.4445 16.6666 55.3333 12.6666C52.2222 8.66664 48.8756 8.45775 45.2933 12.04L34.6667 22.6666C32.8889 24.4444 32.8889 26.2222 34.6667 28L35.4467 28.78C36.7045 30.0378 37.3333 31.5555 37.3333 33.3333V60C37.3333 60.8889 37.7778 61.3333 38.6667 61.3333H50.8933C53.4089 61.3333 55.5556 60.4444 57.3333 58.6666C59.1111 56.8889 60 54.7422 60 52.2266V26.2666Z',
    hole: { cx: 32, cy: 37.3333, r: 2.6667 },
    leftGradient: { x1: 7.905, y1: 17.092, x2: 37.725, y2: 32.434 },
    rightGradient: { x1: 46.667, y1: 9.501, x2: 46.667, y2: 61.333 },
    /** 작은 크기에서는 왼쪽 기둥 아래에 단색을 깔아 반투명 그라디언트가 배경에 묻히지 않게 한다. */
    leftBase: true,
  },
  large: {
    viewBox: '0 0 84.2723 78',
    left: 'M0 25.2295C0 17.6048 2.3409 10.7828 7.02269 4.76334C11.7045 -1.25611 16.7408 -1.57046 22.1315 3.82029L38.1232 19.812C40.7985 22.4873 40.7985 25.1626 38.1232 27.8379L36.9494 29.0117C35.0566 30.9045 34.1102 33.1885 34.1102 35.8638V75.9935C34.1102 77.3312 33.4414 78 32.1037 78H13.7043C9.91872 78 6.68828 76.6623 4.01297 73.987C1.33766 71.3117 0 68.0813 0 64.2957V25.2295Z',
    right:
      'M84.2723 25.2295C84.2723 17.6048 81.9314 10.7828 77.2496 4.76334C72.5678 -1.25611 67.5316 -1.57046 62.1408 3.82029L46.1491 19.812C43.4738 22.4873 43.4738 25.1626 46.1491 27.8379L47.3229 29.0117C49.2157 30.9045 50.1621 33.1885 50.1621 35.8638V75.9935C50.1621 77.3312 50.8309 78 52.1686 78H70.568C74.3536 78 77.584 76.6623 80.2593 73.987C82.9347 71.3117 84.2723 68.0813 84.2723 64.2957V25.2295Z',
    hole: { cx: 42.1361, cy: 41.8833, r: 4.013 },
    leftGradient: { x1: 5.8767, y1: 11.4226, x2: 50.7512, y2: 34.5097 },
    rightGradient: { x1: 64.2075, y1: 0, x2: 64.2075, y2: 78 },
    leftBase: false,
  },
} as const;

/** large 심볼의 가로/세로 비율. 자리 크기를 계산할 때 쓴다. */
export const BRAND_SYMBOL_LARGE_RATIO = 84.2723 / 78;

/** ImageResponse(satori)에서도 그려야 해서 훅 없이 그린다. 한 화면에 여러 개를 그리면 idPrefix를 서로 다르게 준다. */
export function BrandSymbol({
  variant,
  idPrefix,
  ...props
}: ComponentProps<'svg'> & {
  variant: keyof typeof SYMBOLS;
  idPrefix: string;
}) {
  const symbol = SYMBOLS[variant];
  const leftId = `${idPrefix}-brand-left`;
  const rightId = `${idPrefix}-brand-right`;
  return (
    <svg viewBox={symbol.viewBox} fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient
          id={leftId}
          gradientUnits="userSpaceOnUse"
          {...symbol.leftGradient}
        >
          <stop stopColor="#0A6CC2" />
          <stop offset="1" stopColor="#2F90E0" />
        </linearGradient>
        <linearGradient
          id={rightId}
          gradientUnits="userSpaceOnUse"
          {...symbol.rightGradient}
        >
          <stop stopColor="#8CC0F5" />
          <stop offset="1" stopColor="#4F9EEA" />
        </linearGradient>
      </defs>
      {symbol.leftBase && <path d={symbol.left} fill={HOLE_COLOR} />}
      <path d={symbol.left} fill={`url(#${leftId})`} fillOpacity={0.9} />
      <path d={symbol.right} fill={`url(#${rightId})`} />
      <circle {...symbol.hole} fill={HOLE_COLOR} />
    </svg>
  );
}
