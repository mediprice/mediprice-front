import { useTranslations } from 'next-intl';

import { LEGAL_DOCUMENT_VERSIONS, LEGAL_FACTS } from '@/config/legal';
import { LegalDocument } from '@/features/legal/components/legal-document';

import { ClosingSections } from './closing-sections';
import { CollectionSections } from './collection-sections';
import { RightsSections } from './rights-sections';
import { SharingSections } from './sharing-sections';
import { TechnologySections } from './technology-sections';

/** 목차 순서이자 각 항의 앵커. 항 번호는 메시지 제목에 있으므로 순서를 바꾸면 제목도 고친다. */
const SECTIONS = [
  { id: 'purpose', key: 'purpose' },
  { id: 'items', key: 'items' },
  { id: 'retention', key: 'retention' },
  { id: 'destruction', key: 'destruction' },
  { id: 'third-party', key: 'thirdParty' },
  { id: 'outsourcing', key: 'outsourcing' },
  { id: 'overseas', key: 'overseas' },
  { id: 'sensitive', key: 'sensitive' },
  { id: 'rights', key: 'rights' },
  { id: 'officer', key: 'officer' },
  { id: 'children', key: 'children' },
  { id: 'security', key: 'security' },
  { id: 'cookies', key: 'cookies' },
  { id: 'location', key: 'location' },
  { id: 'ai', key: 'ai' },
  { id: 'remedies', key: 'remedies' },
  { id: 'changes', key: 'changes' },
] as const;

export function PrivacyDocument() {
  const t = useTranslations('legal.privacy');
  return (
    <LegalDocument
      name="privacy"
      intro={t('intro')}
      effectiveDate={LEGAL_FACTS.effectiveDates.PRIVACY}
      version={LEGAL_DOCUMENT_VERSIONS.PRIVACY}
      toc={SECTIONS.map((section) => ({
        id: section.id,
        title: t(`${section.key}.title`),
      }))}
    >
      <CollectionSections />
      <SharingSections />
      <RightsSections />
      <TechnologySections />
      <ClosingSections />
    </LegalDocument>
  );
}
