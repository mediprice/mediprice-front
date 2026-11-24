import { useFormatter, useTranslations } from 'next-intl';

import { LEGAL_DOCUMENT_VERSIONS, LEGAL_FACTS } from '@/config/legal';
import { legalRichTags } from '@/features/legal/components/legal-rich-tags';
import { LegalSection } from '@/features/legal/components/legal-section';
import { LegalTable } from '@/features/legal/components/legal-table';
import { PendingFact } from '@/features/legal/components/pending-fact';
import { parseLegalDate } from '@/features/legal/legal-date';

/** 처리방침에 안내하는 권익침해 상담·신고 기관(2026-11 확인). 번호나 주소가 바뀌면 함께 고친다. */
const AGENCIES = [
  { key: 'kopico', website: 'https://www.kopico.go.kr' },
  { key: 'kisa', website: 'https://privacy.kisa.or.kr' },
  { key: 'spo', website: 'https://www.spo.go.kr' },
  { key: 'police', website: 'https://ecrm.police.go.kr' },
] as const;

const LINK =
  'text-primary-text underline underline-offset-4 wrap-anywhere hover:decoration-2';

/** 16~17항: 권익침해 구제 방법, 처리방침 변경과 이력. */
export function ClosingSections() {
  const t = useTranslations('legal.privacy');
  const format = useFormatter();
  const effectiveDate = LEGAL_FACTS.effectiveDates.PRIVACY;
  return (
    <>
      <LegalSection id="remedies" title={t('remedies.title')}>
        {t.rich('remedies.body', legalRichTags)}
        <LegalTable
          caption={t('remedies.caption')}
          columns={[
            t('remedies.colAgency'),
            t('remedies.colPhone'),
            t('remedies.colWebsite'),
          ]}
          rows={AGENCIES.map((agency) => [
            t(`remedies.${agency.key}`),
            <span key="phone" className="whitespace-nowrap tabular-nums">
              {t(`remedies.${agency.key}Phone`)}
            </span>,
            <a key="website" href={agency.website} className={LINK}>
              {agency.website.replace('https://', '')}
            </a>,
          ])}
          minWidth="md"
        />
      </LegalSection>
      <LegalSection id="changes" title={t('changes.title')}>
        {t.rich('changes.body', legalRichTags)}
        <LegalTable
          caption={t('changes.caption')}
          columns={[
            t('changes.colVersion'),
            t('changes.colDate'),
            t('changes.colSummary'),
          ]}
          rows={[
            [
              <span key="version" className="tabular-nums">
                {LEGAL_DOCUMENT_VERSIONS.PRIVACY}
              </span>,
              effectiveDate ? (
                format.dateTime(parseLegalDate(effectiveDate), 'date')
              ) : (
                <PendingFact key="date" />
              ),
              t('changes.initial'),
            ],
          ]}
        />
      </LegalSection>
    </>
  );
}
