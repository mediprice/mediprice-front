import { useTranslations } from 'next-intl';

import { LEGAL_FACTS } from '@/config/legal';
import { FactList } from '@/features/legal/components/fact-list';
import { legalRichTags } from '@/features/legal/components/legal-rich-tags';
import { LegalSection } from '@/features/legal/components/legal-section';
import { PendingFact } from '@/features/legal/components/pending-fact';

function OperatorFacts() {
  const t = useTranslations('legal.operator');
  const { operator } = LEGAL_FACTS;
  return (
    <FactList
      title={t('title')}
      rows={[
        { label: t('name'), value: operator.name },
        { label: t('representative'), value: operator.representative },
        {
          label: t('businessRegistrationNumber'),
          value: operator.businessRegistrationNumber,
        },
        { label: t('address'), value: operator.address },
        { label: t('email'), value: operator.email },
        { label: t('phone'), value: operator.phone },
      ]}
    />
  );
}

/** 8~12항: 민감정보, 정보주체 권리, 보호책임자, 14세 미만, 안전성 확보 조치. */
export function RightsSections() {
  const t = useTranslations('legal.privacy');
  const { privacyOfficer, ai, minimumAge, security } = LEGAL_FACTS;
  return (
    <>
      <LegalSection id="sensitive" title={t('sensitive.title')}>
        {t.rich('sensitive.body', legalRichTags)}
        <p>
          {ai.medicalProfileSentToProvider === null ? (
            <PendingFact item={t('sensitive.aiProfilePending')} />
          ) : (
            t('sensitive.aiProfile', {
              sent: ai.medicalProfileSentToProvider ? 'yes' : 'no',
            })
          )}
        </p>
      </LegalSection>
      <LegalSection id="rights" title={t('rights.title')}>
        {t.rich('rights.body', legalRichTags)}
      </LegalSection>
      <LegalSection id="officer" title={t('officer.title')}>
        {t.rich('officer.body', legalRichTags)}
        <FactList
          title={t('officer.listTitle')}
          rows={[
            { label: t('officer.name'), value: privacyOfficer.name },
            { label: t('officer.position'), value: privacyOfficer.position },
            { label: t('officer.email'), value: privacyOfficer.email },
            { label: t('officer.phone'), value: privacyOfficer.phone },
          ]}
        />
        <OperatorFacts />
      </LegalSection>
      <LegalSection id="children" title={t('children.title')}>
        {minimumAge === null ? (
          <p>
            <PendingFact item={t('children.pending')} />
          </p>
        ) : (
          t.rich('children.body', { ...legalRichTags, age: minimumAge })
        )}
      </LegalSection>
      <LegalSection id="security" title={t('security.title')}>
        {t.rich('security.body', legalRichTags)}
        {security.internalPlanAdopted === null ? (
          <p>
            <PendingFact item={t('security.administrativePending')} />
          </p>
        ) : (
          security.internalPlanAdopted &&
          t.rich('security.administrative', legalRichTags)
        )}
      </LegalSection>
    </>
  );
}
