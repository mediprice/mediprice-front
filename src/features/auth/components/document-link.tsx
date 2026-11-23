import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

/** 동의 흐름(돌아갈 경로)을 잃지 않도록 문서는 새 탭으로 연다. */
export function DocumentLink({
  href,
  children,
}: {
  href: '/terms' | '/privacy';
  children: ReactNode;
}) {
  const t = useTranslations('auth.consent');
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="touch-target inline-flex w-fit items-center gap-1 rounded-sm py-1 text-body-sm text-primary-text underline underline-offset-4 hover:decoration-2"
    >
      {children}
      <ExternalLink
        aria-hidden="true"
        className="size-4 shrink-0"
        strokeWidth={1.75}
      />
      <span className="sr-only">{t('newTab')}</span>
    </a>
  );
}
