import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { LEGAL_FACTS } from '@/config/legal';
import { cn } from '@/lib/utils';

import { PageContainer } from './page-container';

/** 개인정보 처리방침은 다른 정책과 구별되게 굵게 쓰는 것이 관례다. */
const POLICY_LINKS = [
  { key: 'terms', href: '/terms', emphasized: false },
  { key: 'privacy', href: '/privacy', emphasized: true },
  { key: 'reviewPolicy', href: '/policy/reviews', emphasized: false },
] as const;

/** 운영자 정보 중 정하지 않은 값(null)은 줄째 숨긴다. 법적 문서에서는 "운영자 확정 필요"로 보인다. */
function OperatorInfo() {
  const t = useTranslations('common.footer');
  const { operator, privacyOfficer } = LEGAL_FACTS;
  const officerContact = privacyOfficer.email ?? (privacyOfficer.phone || null);
  const lines = [
    operator.name && {
      key: 'operator',
      content: t('operator', { name: operator.name }),
    },
    privacyOfficer.name && {
      key: 'officer',
      content: officerContact
        ? t('officerContact', {
            name: privacyOfficer.name,
            contact: officerContact,
          })
        : t('officer', { name: privacyOfficer.name }),
    },
    operator.email && {
      key: 'contact',
      content: t.rich('contact', {
        email: operator.email,
        link: (chunks) => (
          <a
            href={`mailto:${operator.email}`}
            className="underline underline-offset-4 hover:text-text-primary"
          >
            {chunks}
          </a>
        ),
      }),
    },
  ].filter((line) => !!line);

  if (lines.length === 0) return null;
  return (
    <address className="text-caption text-text-tertiary not-italic">
      <ul aria-label={t('operatorInfo')} className="flex flex-wrap gap-x-4">
        {lines.map((line) => (
          <li key={line.key} className="wrap-anywhere">
            {line.content}
          </li>
        ))}
      </ul>
    </address>
  );
}

/** className은 하단 탭바 높이만큼 아래 여백을 줄 때 쓴다(회색 바탕이 끝까지 이어지게). */
export function SiteFooter({ className }: { className?: string }) {
  const t = useTranslations('common.footer');
  return (
    <footer className={cn('bg-surface', className)}>
      <PageContainer className="space-y-2 pt-10 pb-12 lg:pt-12 lg:pb-16">
        <p className="text-label-bold text-text-primary">{t('source')}</p>
        <p className="max-w-2xl text-body-sm text-text-secondary">
          {t('notice')}
        </p>
        <nav aria-label={t('policies')} className="pt-2">
          <ul className="flex flex-wrap gap-x-5">
            {POLICY_LINKS.map((link) => (
              <li key={link.key}>
                <Link
                  href={link.href}
                  className={cn(
                    'inline-flex min-h-11 items-center text-label text-text-secondary hover:text-text-primary hover:underline',
                    link.emphasized && 'text-label-bold text-text-primary',
                  )}
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <OperatorInfo />
        <p className="pt-2 text-caption text-text-tertiary">{t('copyright')}</p>
      </PageContainer>
    </footer>
  );
}
