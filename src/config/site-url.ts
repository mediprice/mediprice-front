type SiteUrlVars = {
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_ENV?: string;
  VERCEL_BRANCH_URL?: string;
};

/** Vercel 미리보기는 배포마다 주소가 달라 NEXT_PUBLIC_SITE_URL을 고정할 수 없으므로, 값이 없으면 브랜치 주소를 쓴다. */
export function resolveSiteUrl(vars: SiteUrlVars): string | undefined {
  const explicit = vars.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit;
  if (vars.VERCEL_ENV === 'preview' && vars.VERCEL_BRANCH_URL) {
    return `https://${vars.VERCEL_BRANCH_URL}`;
  }
  return undefined;
}
