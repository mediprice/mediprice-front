import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

import { securityHeaderRules } from './src/config/security-headers';
import { env } from './src/env';

const nextConfig: NextConfig = {
  /** 미리보기에서 서버가 대신 정한 사이트 주소를 브라우저 번들에도 같은 값으로 넣는다. */
  ...(env.NEXT_PUBLIC_SITE_URL
    ? { env: { NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL } }
    : {}),
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  devIndicators: { position: 'bottom-left' },
  async headers() {
    return securityHeaderRules({
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    });
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
