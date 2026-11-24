import { describe, expect, it } from 'vitest';

import {
  contentSecurityPolicy,
  type Deployment,
  securityHeaderRules,
} from './security-headers';

const production: Deployment = {
  nodeEnv: 'production',
  vercelEnv: 'production',
};
const preview: Deployment = { nodeEnv: 'production', vercelEnv: 'preview' };
const development: Deployment = {
  nodeEnv: 'development',
  vercelEnv: undefined,
};

function directivesOf(policy: string) {
  return new Map(
    policy.split('; ').map((directive) => {
      const [name = '', ...sources] = directive.split(' ');
      return [name, sources];
    }),
  );
}

function pageHeaders(deployment: Deployment) {
  return securityHeaderRules(deployment)[0]?.headers ?? [];
}

describe('securityHeaderRules', () => {
  it('CSP를 보고 전용이 아니라 강제 헤더로 보낸다', () => {
    const keys = pageHeaders(production).map((header) => header.key);

    expect(keys).toContain('Content-Security-Policy');
    expect(keys).not.toContain('Content-Security-Policy-Report-Only');
  });

  it('운영 빌드에서만 HSTS를 보낸다', () => {
    const keysOf = (deployment: Deployment) =>
      pageHeaders(deployment).map((header) => header.key);

    expect(keysOf(production)).toContain('Strict-Transport-Security');
    expect(keysOf(development)).not.toContain('Strict-Transport-Security');
  });

  it('BFF 응답에는 아무것도 실행하지 않는 CSP를 뒤에 덮어쓴다', () => {
    const [page, bff] = securityHeaderRules(production);

    expect(page?.source).toBe('/:path*');
    expect(bff).toEqual({
      source: '/bff/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'none'; frame-ancestors 'none'; sandbox",
        },
      ],
    });
  });
});

describe('contentSecurityPolicy', () => {
  it('프레이밍·base 주입·외부 폼 전송·플러그인을 막는다', () => {
    const directives = directivesOf(contentSecurityPolicy(production));

    expect(directives.get('default-src')).toEqual(["'self'"]);
    expect(directives.get('frame-ancestors')).toEqual(["'none'"]);
    expect(directives.get('base-uri')).toEqual(["'self'"]);
    expect(directives.get('form-action')).toEqual(["'self'"]);
    expect(directives.get('object-src')).toEqual(["'none'"]);
    expect(directives.get('frame-src')).toEqual(["'none'"]);
  });

  it('브라우저는 BFF, 네이버 지도, Cloudflare 웹 분석에만 연결한다', () => {
    const directives = directivesOf(contentSecurityPolicy(production));

    expect(directives.get('connect-src')).toEqual([
      "'self'",
      'oapi.map.naver.com',
      '*.map.naver.net',
      'nrbe.pstatic.net',
      '*.nelo.navercorp.com',
      'cloudflareinsights.com',
    ]);
  });

  it('보고 주소를 두지 않는다', () => {
    const policy = contentSecurityPolicy(production);

    expect(policy).not.toMatch(/report-(uri|to)/);
  });

  it('운영에는 eval·Vercel 툴바 출처를 넣지 않는다', () => {
    const policy = contentSecurityPolicy(production);

    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).not.toContain('vercel.live');
  });

  it('미리보기에서만 Vercel 툴바 출처를 허용한다', () => {
    const directives = directivesOf(contentSecurityPolicy(preview));

    expect(directives.get('script-src')).toContain('https://vercel.live');
    expect(directives.get('frame-src')).toEqual(['https://vercel.live']);
    expect(directives.get('connect-src')).toContain('wss://ws-us3.pusher.com');
  });

  it('개발 서버는 eval과 HMR 웹소켓을 허용한다', () => {
    const directives = directivesOf(contentSecurityPolicy(development));

    expect(directives.get('script-src')).toContain("'unsafe-eval'");
    expect(directives.get('connect-src')).toContain('ws:');
  });
});
