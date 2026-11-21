import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

import { env } from './src/env';

const isDev = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/** 네이버 지도 SDK(naver-sdk.ts)가 불러오는 출처. SDK가 페이지 scheme을 따라 http/https를 고르므로 scheme 없이 쓴다(https 페이지에서는 https만 허용된다). 인증·스타일은 JSONP 스크립트, 오류 수집은 nelo로 간다. */
const NAVER_MAP_SCRIPT = ['oapi.map.naver.com', '*.map.naver.net'];
const NAVER_MAP_IMG = ['*.map.naver.net', 'static.naver.net', '*.pstatic.net'];
const NAVER_MAP_CONNECT = [
  'oapi.map.naver.com',
  '*.map.naver.net',
  '*.nelo.navercorp.com',
];

/** nonce 없이 정적 렌더링을 지키는 정책이라 인라인 스크립트를 허용한다. 개발 서버는 React 디버깅에 eval이 필요하다. */
const contentSecurityPolicy = [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    ...NAVER_MAP_SCRIPT,
  ].join(' '),
  "style-src 'self' 'unsafe-inline'",
  ["img-src 'self' data: blob:", ...NAVER_MAP_IMG].join(' '),
  "font-src 'self' data:",
  ["connect-src 'self'", ...NAVER_MAP_CONNECT, ...(isDev ? ['ws:'] : [])].join(
    ' ',
  ),
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=(self)',
  },
  /** 운영 트래픽으로 위반이 없는 것을 확인한 뒤 Content-Security-Policy로 바꾼다. */
  {
    key: 'Content-Security-Policy-Report-Only',
    value: contentSecurityPolicy,
  },
  ...(isProduction
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains',
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  /** 미리보기에서 서버가 대신 정한 사이트 주소를 브라우저 번들에도 같은 값으로 넣는다. */
  ...(env.NEXT_PUBLIC_SITE_URL
    ? { env: { NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL } }
    : {}),
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  devIndicators: { position: 'bottom-left' },
  /** 아이콘 태그를 읽지 않고 /favicon.ico를 바로 찾는 브라우저·크롤러를 생성 아이콘으로 보낸다. */
  async redirects() {
    return [
      { source: '/favicon.ico', destination: '/icon/32', permanent: true },
    ];
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
