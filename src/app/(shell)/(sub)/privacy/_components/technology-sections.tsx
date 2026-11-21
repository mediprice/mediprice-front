import { useTranslations } from 'next-intl';

import { LEGAL_FACTS } from '@/config/legal';
import { legalRichTags } from '@/features/legal/components/legal-rich-tags';
import { LegalSection } from '@/features/legal/components/legal-section';
import { LegalTable } from '@/features/legal/components/legal-table';
import { PendingFact } from '@/features/legal/components/pending-fact';

/** 쿠키 이름은 server/bff/cookies.ts의 ACCESS_COOKIE·REFRESH_COOKIE와 같아야 한다. */
const COOKIES = [
  { name: 'mp_access', key: 'access' },
  { name: 'mp_refresh', key: 'refresh' },
] as const;

/** 13~15항: 쿠키, 위치정보, AI 찾기 입력. */
export function TechnologySections() {
  const t = useTranslations('legal.privacy');
  const { providerTrainingUse } = LEGAL_FACTS.ai;
  return (
    <>
      <LegalSection id="cookies" title={t('cookies.title')}>
        {t.rich('cookies.body', legalRichTags)}
        <LegalTable
          caption={t('cookies.caption')}
          columns={[
            t('cookies.colName'),
            t('cookies.colPurpose'),
            t('cookies.colPeriod'),
          ]}
          rows={COOKIES.map((cookie) => [
            <code key="name" className="font-mono">
              {cookie.name}
            </code>,
            t(`cookies.${cookie.key}Purpose`),
            t(`cookies.${cookie.key}Period`),
          ])}
        />
        {t.rich('cookies.storage', legalRichTags)}
      </LegalSection>
      <LegalSection id="location" title={t('location.title')}>
        {t.rich('location.body', legalRichTags)}
      </LegalSection>
      <LegalSection id="ai" title={t('ai.title')}>
        {t.rich('ai.body', legalRichTags)}
        <p>
          {providerTrainingUse === null ? (
            <PendingFact item={t('ai.trainingPending')} />
          ) : (
            t('ai.training', { use: providerTrainingUse ? 'yes' : 'no' })
          )}
        </p>
        {t.rich('ai.warning', legalRichTags)}
      </LegalSection>
    </>
  );
}
