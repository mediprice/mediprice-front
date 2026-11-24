import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { LEGAL_DOCUMENT_VERSIONS, LEGAL_FACTS } from '@/config/legal';
import { FactList } from '@/features/legal/components/fact-list';
import { LegalDocument } from '@/features/legal/components/legal-document';
import { legalRichTags } from '@/features/legal/components/legal-rich-tags';
import { LegalSection } from '@/features/legal/components/legal-section';
import { parseLegalDate } from '@/features/legal/legal-date';

/** 항 번호는 메시지 제목에 있으므로 순서를 바꾸면 제목도 고친다. */
const SECTIONS = [
  'writing',
  'prohibited',
  'reporting',
  'temporary',
  'actions',
  'contact',
  'supplementary',
] as const;

export function ReviewPolicyDocument() {
  const t = useTranslations('legal.reviewPolicy');
  const tDocument = useTranslations('legal.document');
  const tOperator = useTranslations('legal.operator');
  const format = useFormatter();
  const { operator, effectiveDates } = LEGAL_FACTS;
  const effectiveDate = effectiveDates.REVIEW_POLICY;

  const extras: Partial<Record<(typeof SECTIONS)[number], ReactNode>> = {
    contact: (
      <FactList
        rows={[
          { label: tOperator('email'), value: operator.email },
          { label: tOperator('phone'), value: operator.phone },
        ]}
      />
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
      name="reviewPolicy"
      intro={t.rich('intro', legalRichTags)}
      effectiveDate={effectiveDate}
      version={LEGAL_DOCUMENT_VERSIONS.REVIEW_POLICY}
      toc={SECTIONS.map((id) => ({ id, title: t(`${id}.title`) }))}
    >
      {SECTIONS.map((id) => (
        <LegalSection key={id} id={id} title={t(`${id}.title`)}>
          {t.rich(`${id}.body`, legalRichTags)}
          {extras[id]}
        </LegalSection>
      ))}
    </LegalDocument>
  );
}
