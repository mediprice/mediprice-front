import { useTranslations } from 'next-intl';

import { LEGAL_FACTS } from '@/config/legal';
import { legalRichTags } from '@/features/legal/components/legal-rich-tags';
import { LegalSection } from '@/features/legal/components/legal-section';
import { LegalTable } from '@/features/legal/components/legal-table';
import { PendingFact } from '@/features/legal/components/pending-fact';

type Processor = (typeof LEGAL_FACTS.processors)[number];

/** 국가를 아직 정하지 않은 업체도 국외일 수 있으므로 표에 남겨 "확정 필요"로 보인다. */
function isOverseas(processor: Processor) {
  return (
    processor.countries === null ||
    processor.countries.some((country) => country !== 'KR')
  );
}

function Recipient({ processor }: { processor: Processor }) {
  return (
    <span className="flex flex-col items-start gap-1">
      <span>{processor.company ?? <PendingFact />}</span>
      <span className="wrap-anywhere text-text-secondary">
        {processor.contact ?? <PendingFact />}
      </span>
    </span>
  );
}

function OverseasTable({ processors }: { processors: Processor[] }) {
  const t = useTranslations('legal.privacy.overseas');
  const tProcessors = useTranslations('legal.processors');
  const tCountries = useTranslations('legal.countries');
  return (
    <LegalTable
      caption={t('caption')}
      columns={[
        t('colRecipient'),
        t('colCountry'),
        t('colItems'),
        t('colTiming'),
        t('colPurpose'),
        t('colRetention'),
      ]}
      rows={processors.map((processor) => [
        <Recipient key="recipient" processor={processor} />,
        processor.countries ? (
          processor.countries.map((country) => tCountries(country)).join(', ')
        ) : (
          <PendingFact />
        ),
        tProcessors(`${processor.task}.items`),
        tProcessors(`${processor.task}.timing`),
        tProcessors(`${processor.task}.task`),
        processor.retention ?? <PendingFact />,
      ])}
      minWidth="lg"
    />
  );
}

/** 5~7항: 제3자 제공, 처리 위탁, 국외 이전. 업체와 국가는 legal-facts.json에서 온다. */
export function SharingSections() {
  const t = useTranslations('legal.privacy');
  const tProcessors = useTranslations('legal.processors');
  const { thirdParties, processors } = LEGAL_FACTS;
  const overseas = processors.filter(isOverseas);
  return (
    <>
      <LegalSection id="third-party" title={t('thirdParty.title')}>
        {thirdParties.length === 0 ? (
          t.rich('thirdParty.none', legalRichTags)
        ) : (
          <>
            {t.rich('thirdParty.some', legalRichTags)}
            <LegalTable
              caption={t('thirdParty.caption')}
              columns={[
                t('thirdParty.colRecipient'),
                t('thirdParty.colPurpose'),
                t('thirdParty.colItems'),
                t('thirdParty.colRetention'),
              ]}
              rows={thirdParties.map((party) => [
                party.recipient,
                party.purpose,
                party.items,
                party.retention,
              ])}
              minWidth="lg"
            />
          </>
        )}
      </LegalSection>
      <LegalSection id="outsourcing" title={t('outsourcing.title')}>
        {t.rich('outsourcing.body', legalRichTags)}
        <LegalTable
          caption={t('outsourcing.caption')}
          columns={[t('outsourcing.colCompany'), t('outsourcing.colTask')]}
          rows={processors.map((processor) => [
            processor.company ?? <PendingFact key="company" />,
            tProcessors(`${processor.task}.task`),
          ])}
        />
      </LegalSection>
      <LegalSection id="overseas" title={t('overseas.title')}>
        {overseas.length === 0 ? (
          t.rich('overseas.none', legalRichTags)
        ) : (
          <>
            {t.rich('overseas.body', legalRichTags)}
            <OverseasTable processors={overseas} />
            <p>{t.rich('overseas.refuse', legalRichTags)}</p>
          </>
        )}
      </LegalSection>
    </>
  );
}
