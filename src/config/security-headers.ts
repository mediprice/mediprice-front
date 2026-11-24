export type Deployment = {
  nodeEnv: string | undefined;
  /** Vercel 시스템 환경변수 VERCEL_ENV(production·preview·development). Vercel 밖에서는 없다. */
  vercelEnv: string | undefined;
};

/** 네이버 지도 SDK(naver-sdk.ts)가 불러오는 출처. SDK가 페이지 scheme을 따라 http/https를 고르므로 scheme 없이 쓴다(https 페이지에서는 https만 허용된다). 인증·스타일은 JSONP 스크립트, 오류 수집은 nelo로 간다. */
const NAVER_MAP_SCRIPT = [
  'oapi.map.naver.com',
  '*.map.naver.net',
  'nrbe.pstatic.net',
];
const NAVER_MAP_IMG = ['*.map.naver.net', 'static.naver.net', '*.pstatic.net'];
const NAVER_MAP_CONNECT = [
  'oapi.map.naver.com',
  '*.map.naver.net',
  'nrbe.pstatic.net',
  '*.nelo.navercorp.com',
];

/** 도메인 앞단의 Cloudflare가 페이지에 넣는 웹 분석 스크립트와 그 전송 주소. */
const CLOUDFLARE_INSIGHTS = {
  script: ['static.cloudflareinsights.com'],
  connect: ['cloudflareinsights.com'],
};

/** Vercel 미리보기 툴바(댓글)가 쓰는 출처. 운영 배포에는 넣지 않는다. */
const VERCEL_TOOLBAR = {
  script: ['https://vercel.live'],
  style: ['https://vercel.live'],
  img: ['https://vercel.live', 'https://vercel.com'],
  font: ['https://vercel.live', 'https://assets.vercel.com'],
  connect: ['https://vercel.live', 'wss://ws-us3.pusher.com'],
  frame: ['https://vercel.live'],
};

/** nonce 없이 정적 렌더링·CDN 캐시를 지키는 정책이라 인라인 스크립트는 허용하고, 그 밖의 지시어로 외부 전송·프레이밍·base 주입을 막는다. 개발 서버는 React 디버깅에 eval이 필요하다. */
export function contentSecurityPolicy({ nodeEnv, vercelEnv }: Deployment) {
  const isDev = nodeEnv === 'development';
  const toolbar = vercelEnv === 'preview' ? VERCEL_TOOLBAR : null;
  const directive = (name: string, ...sources: (string[] | undefined)[]) =>
    [name, ...sources.flatMap((list) => list ?? [])].join(' ');

  return [
    "default-src 'self'",
    directive(
      'script-src',
      ["'self'", "'unsafe-inline'"],
      isDev ? ["'unsafe-eval'"] : [],
      NAVER_MAP_SCRIPT,
      CLOUDFLARE_INSIGHTS.script,
      toolbar?.script,
    ),
    directive('style-src', ["'self'", "'unsafe-inline'"], toolbar?.style),
    directive(
      'img-src',
      ["'self'", 'data:', 'blob:'],
      NAVER_MAP_IMG,
      toolbar?.img,
    ),
    directive('font-src', ["'self'", 'data:'], toolbar?.font),
    directive(
      'connect-src',
      ["'self'"],
      NAVER_MAP_CONNECT,
      CLOUDFLARE_INSIGHTS.connect,
      isDev ? ['ws:'] : [],
      toolbar?.connect,
    ),
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    directive('frame-src', toolbar?.frame ?? ["'none'"]),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

function securityHeaders(deployment: Deployment) {
  return [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(self), geolocation=(self)',
    },
    {
      key: 'Content-Security-Policy',
      value: contentSecurityPolicy(deployment),
    },
    ...(deployment.nodeEnv === 'production'
      ? [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
        ]
      : []),
  ];
}

/** BFF가 중계한 응답은 문서로 열려도 아무것도 실행하지 않게 한다. Next는 같은 키면 뒤의 규칙을 쓴다. */
const BFF_CONTENT_SECURITY_POLICY =
  "default-src 'none'; frame-ancestors 'none'; sandbox";

export function securityHeaderRules(deployment: Deployment) {
  return [
    { source: '/:path*', headers: securityHeaders(deployment) },
    {
      source: '/bff/:path*',
      headers: [
        { key: 'Content-Security-Policy', value: BFF_CONTENT_SECURITY_POLICY },
      ],
    },
  ];
}
