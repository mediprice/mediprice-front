import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { parseLegalDate } from '@/features/legal/legal-date';

import { FloatingToc } from './floating-toc';
import { LegalToc, type TocEntry } from './legal-toc';
import { PendingFact } from './pending-fact';

const DOCUMENTS = [
  { name: 'terms', href: '/terms' },
  { name: 'privacy', href: '/privacy' },
  { name: 'reviewPolicy', href: '/policy/reviews' },
] as const;

type LegalDocumentName = (typeof DOCUMENTS)[number]['name'];

/** 법적 문서 한 편의 틀: 제목, 시행일·버전, 목차(모바일은 본문을 지나면 떠 있는 목차 버튼도), 본문, 다른 문서 링크. */
export function LegalDocument({
  name,
  intro,
  effectiveDate,
  version,
  toc,
  children,
}: {
  name: LegalDocumentName;
  intro: ReactNode;
  /** YYYY-MM-DD. null이면 "운영자 확정 필요"로 보인다. */
  effectiveDate: string | null;
  version: string;
  toc: TocEntry[];
  children: ReactNode;
}) {
  const t = useTranslations('legal');
  const format = useFormatter();
  const related = DOCUMENTS.filter((document) => document.name !== name);

  return (
    <PageContainer className="pt-6 pb-section lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start lg:gap-12 lg:pt-12">
      <LegalToc entries={toc} variant="sidebar" />
      <article aria-labelledby="legal-title" className="max-w-4xl min-w-0">
        <header className="max-w-prose">
          <h1 id="legal-title" className="text-display text-text-primary">
            {t(`${name}.title`)}
          </h1>
          <p className="mt-3 text-body-lg text-text-secondary">{intro}</p>
          <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <dt className="text-label text-text-secondary">
                {t('document.effectiveDate')}
              </dt>
              <dd className="text-label-bold text-text-primary">
                {effectiveDate ? (
                  <time dateTime={effectiveDate}>
                    {format.dateTime(parseLegalDate(effectiveDate), 'date')}
                  </time>
                ) : (
                  <PendingFact />
                )}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-label text-text-secondary">
                {t('document.version')}
              </dt>
              <dd className="text-label-bold text-text-primary tabular-nums">
                {version}
              </dd>
            </div>
          </dl>
        </header>
        <div id="legal-toc" className="mt-6 max-w-prose lg:hidden">
          <LegalToc entries={toc} variant="inline" />
        </div>
        <FloatingToc entries={toc} anchorId="legal-toc" />
        <div className="mt-10 space-y-10">{children}</div>
        <nav
          aria-labelledby="legal-related"
          className="mt-12 max-w-prose rounded-xl bg-surface p-4 sm:p-5"
        >
          <h2 id="legal-related" className="text-subheading text-text-primary">
            {t('document.related')}
          </h2>
          <ul className="mt-2 divide-y divide-border">
            {related.map((document) => (
              <li key={document.name}>
                <Link
                  href={document.href}
                  className="flex min-h-12 items-center justify-between gap-3 py-2 text-body text-text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  {t(`${document.name}.title`)}
                  <ChevronRight
                    aria-hidden="true"
                    className="size-5 shrink-0 text-text-tertiary"
                    strokeWidth={1.75}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </PageContainer>
  );
}
