import { describe, expect, it } from 'vitest';

import { resolveSiteUrl } from './site-url';

describe('resolveSiteUrl', () => {
  it('정해 둔 주소가 있으면 그대로 쓴다', () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: 'https://mediprice.app',
        VERCEL_ENV: 'preview',
        VERCEL_BRANCH_URL: 'mediprice-front-git-x.vercel.app',
      }),
    ).toBe('https://mediprice.app');
  });

  it('미리보기에서 주소가 없으면 브랜치 주소를 https로 쓴다', () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: ' ',
        VERCEL_ENV: 'preview',
        VERCEL_BRANCH_URL: 'mediprice-front-git-x.vercel.app',
      }),
    ).toBe('https://mediprice-front-git-x.vercel.app');
  });

  it('운영과 로컬에서는 대신 채우지 않는다', () => {
    expect(
      resolveSiteUrl({
        VERCEL_ENV: 'production',
        VERCEL_BRANCH_URL: 'mediprice-front-git-main.vercel.app',
      }),
    ).toBeUndefined();
    expect(resolveSiteUrl({})).toBeUndefined();
  });
});
