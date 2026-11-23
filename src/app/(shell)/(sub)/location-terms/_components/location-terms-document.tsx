import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { LEGAL_DOCUMENT_VERSIONS, LEGAL_FACTS } from '@/config/legal';
import { FactList } from '@/features/legal/components/fact-list';
import { LegalDocument } from '@/features/legal/components/legal-document';
import { legalRichTags } from '@/features/legal/components/legal-rich-tags';
import { LegalSection } from '@/features/legal/components/legal-section';
import { PendingFact } from '@/features/legal/components/pending-fact';
import { parseLegalDate } from '@/features/legal/legal-date';

/** 항 번호는 메시지 제목에 있으므로 순서를 바꾸면 제목도 고친다. */
const SECTIONS = [
  { id: 'purpose', key: 'purpose' },
  { id: 'service', key: 'service' },
  { id: 'fee', key: 'fee' },
  { id: 'usage', key: 'usage' },
  { id: 'consent', key: 'consent' },
  { id: 'rights', key: 'rights' },
  { id: 'children', key: 'children' },
  { id: 'operator', key: 'operator' },
  { id: 'supplementary', key: 'supplementary' },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

export function LocationTermsDocument() {
  const t = useTranslations('legal.locationTerms');
  const tDocument = useTranslations('legal.document');
  const tOperator = useTranslations('legal.operator');
  const format = useFormatter();
  const { minimumAge, retention, operator, locationService, effectiveDates } =
    LEGAL_FACTS;
  const effectiveDate = effectiveDates.LOCATION;

  const extras: Partial<Record<SectionKey, ReactNode>> = {
    usage: (
      <FactList
        rows={[
          {
            label: t('usage.retentionLabel'),
            value:
              retention.locationUsageDays === null ? (
                <PendingFact item={t('usage.retentionPending')} />
              ) : (
                t('usage.retentionPeriod', {
                  days: retention.locationUsageDays,
                })
              ),
          },
        ]}
      />
    ),
    children:
      minimumAge === null ? (
        <p>
          <PendingFact item={t('children.pending')} />
        </p>
      ) : null,
    operator: (
      <FactList
        rows={[
          { label: tOperator('name'), value: operator.name },
          {
            label: tOperator('representative'),
            value: operator.representative,
          },
          { label: tOperator('address'), value: operator.address },
          { label: tOperator('email'), value: operator.email },
          { label: tOperator('phone'), value: operator.phone },
          {
            label: t('operator.reportNumber'),
            value: locationService.reportNumber,
          },
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
      name="locationTerms"
      intro={t.rich('intro', legalRichTags)}
      effectiveDate={effectiveDate}
      version={LEGAL_DOCUMENT_VERSIONS.LOCATION}
      toc={SECTIONS.map((section) => ({
        id: section.id,
        title: t(`${section.key}.title`),
      }))}
    >
      {SECTIONS.map((section) => (
        <LegalSection
          key={section.id}
          id={section.id}
          title={t(`${section.key}.title`)}
        >
          {section.key === 'children' && minimumAge === null
            ? null
            : t.rich(`${section.key}.body`, {
                ...legalRichTags,
                age: minimumAge ?? 14,
              })}
          {extras[section.key]}
        </LegalSection>
      ))}
    </LegalDocument>
  );
}
