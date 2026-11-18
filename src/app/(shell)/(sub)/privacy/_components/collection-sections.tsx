import { useTranslations } from 'next-intl';

import { LEGAL_FACTS } from '@/config/legal';
import { legalRichTags } from '@/features/legal/components/legal-rich-tags';
import { LegalSection } from '@/features/legal/components/legal-section';
import { LegalTable } from '@/features/legal/components/legal-table';
import { PendingFact } from '@/features/legal/components/pending-fact';

const ITEM_ROWS = [
  'account',
  'profile',
  'favorites',
  'history',
  'reviews',
  'reports',
  'medical',
  'ai',
  'aiQuota',
  'location',
  'auto',
] as const;

const FIXED_RETENTION_ROWS = [
  'account',
  'medical',
  'cookie',
  'ai',
  'aiQuota',
  'location',
] as const;

function RetentionTable() {
  const t = useTranslations('legal.privacy.retention');
  const { accessLogMonths, backupDays, reviewOnWithdrawal } =
    LEGAL_FACTS.retention;
  const rows = [
    ...FIXED_RETENTION_ROWS.map((row) => [t(`${row}Label`), t(`${row}Period`)]),
    [
      t('reviewsLabel'),
      reviewOnWithdrawal ? (
        t('reviewsPeriod', { policy: reviewOnWithdrawal })
      ) : (
        <PendingFact item={t('reviewsPending')} />
      ),
    ],
    [
      t('accessLogLabel'),
      accessLogMonths === null ? (
        <PendingFact item={t('accessLogPending')} />
      ) : (
        t('accessLogPeriod', { months: accessLogMonths })
      ),
    ],
    [
      t('backupLabel'),
      backupDays === null ? (
        <PendingFact item={t('backupPending')} />
      ) : (
        t('backupPeriod', { days: backupDays })
      ),
    ],
  ];
  return (
    <LegalTable
      caption={t('caption')}
      columns={[t('colItem'), t('colPeriod')]}
      rows={rows}
    />
  );
}

/** 1~4항: 처리 목적, 처리 항목, 보유 기간, 파기. */
export function CollectionSections() {
  const t = useTranslations('legal.privacy');
  return (
    <>
      <LegalSection id="purpose" title={t('purpose.title')}>
        {t.rich('purpose.body', legalRichTags)}
      </LegalSection>
      <LegalSection id="items" title={t('items.title')}>
        {t.rich('items.body', legalRichTags)}
        <LegalTable
          caption={t('items.caption')}
          columns={[
            t('items.colCategory'),
            t('items.colItems'),
            t('items.colSource'),
          ]}
          rows={ITEM_ROWS.map((row) => [
            t(`items.${row}Label`),
            t(`items.${row}Items`),
            t(`items.${row}Source`),
          ])}
          minWidth="md"
        />
      </LegalSection>
      <LegalSection id="retention" title={t('retention.title')}>
        {t.rich('retention.body', legalRichTags)}
        <RetentionTable />
      </LegalSection>
      <LegalSection id="destruction" title={t('destruction.title')}>
        {t.rich('destruction.body', legalRichTags)}
      </LegalSection>
    </>
  );
}
