import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { LEGAL_DOCUMENT_VERSIONS, LEGAL_FACTS } from '@/config/legal';
import { FactList } from '@/features/legal/components/fact-list';
import { LegalDocument } from '@/features/legal/components/legal-document';
import { legalRichTags } from '@/features/legal/components/legal-rich-tags';
import { LegalSection } from '@/features/legal/components/legal-section';
import { PendingFact } from '@/features/legal/components/pending-fact';
import { parseLegalDate } from '@/features/legal/legal-date';

/** 조 번호는 메시지 제목에 있으므로 순서를 바꾸면 제목도 고친다. */
const ARTICLES = [
  { id: 'purpose', key: 'purpose' },
  { id: 'definitions', key: 'definitions' },
  { id: 'effect', key: 'effect' },
  { id: 'service', key: 'service' },
  { id: 'membership', key: 'membership' },
  { id: 'withdrawal', key: 'withdrawal' },
  { id: 'duties', key: 'duties' },
  { id: 'operator-duties', key: 'operatorDuties' },
  { id: 'posts', key: 'posts' },
  { id: 'suspension', key: 'suspension' },
  { id: 'disclaimer', key: 'disclaimer' },
  { id: 'disputes', key: 'disputes' },
  { id: 'supplementary', key: 'supplementary' },
] as const;

type ArticleKey = (typeof ARTICLES)[number]['key'];

export function TermsDocument() {
  const t = useTranslations('legal.terms');
  const tDocument = useTranslations('legal.document');
  const format = useFormatter();
  const { minimumAge, retention, effectiveDates } = LEGAL_FACTS;
  const effectiveDate = effectiveDates.TERMS;

  const extras: Partial<Record<ArticleKey, ReactNode>> = {
    membership:
      minimumAge === null ? (
        <p>
          <PendingFact item={t('membership.minimumAgePending')} />
        </p>
      ) : (
        t.rich('membership.minimumAge', { ...legalRichTags, age: minimumAge })
      ),
    withdrawal:
      retention.reviewOnWithdrawal === null ? (
        <p>
          <PendingFact item={t('withdrawal.reviewsPending')} />
        </p>
      ) : (
        t.rich('withdrawal.reviews', {
          ...legalRichTags,
          policy: retention.reviewOnWithdrawal,
        })
      ),
    supplementary: (
      <FactList
        rows={[
          {
            label: tDocument('effectiveDate'),
            value:
              effectiveDate &&
              format.dateTime(parseLegalDate(effectiveDate), 'date'),
          },
        ]}
      />
    ),
  };

  return (
    <LegalDocument
      name="terms"
      intro={t('intro')}
      effectiveDate={effectiveDate}
      version={LEGAL_DOCUMENT_VERSIONS.TERMS}
      toc={ARTICLES.map((article) => ({
        id: article.id,
        title: t(`${article.key}.title`),
      }))}
    >
      {ARTICLES.map((article) => (
        <LegalSection
          key={article.id}
          id={article.id}
          title={t(`${article.key}.title`)}
        >
          {t.rich(`${article.key}.body`, legalRichTags)}
          {extras[article.key]}
        </LegalSection>
      ))}
    </LegalDocument>
  );
}
