import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { LEGAL_FACTS } from '@/config/legal';
import { PendingFact } from '@/features/legal/components/pending-fact';

const ROWS = ['account', 'records', 'consent', 'log'] as const;

/** 개인정보 수집·이용 동의의 필수 고지(항목·목적·보유 기간). 모바일은 행마다 묶은 목록, md부터 표다. 같은 내용을 CSS로만 바꿔 보여 준다. */
export function ConsentSummary({ id }: { id: string }) {
  const t = useTranslations('auth.consent.summary');
  const months = LEGAL_FACTS.retention.accessLogMonths;
  const rows = ROWS.map((row) => ({
    key: row,
    items: t(`${row}Items`),
    purpose: t(`${row}Purpose`),
    period:
      row !== 'log' ? (
        t(`${row}Period`)
      ) : months === null ? (
        <PendingFact item={t('logPending')} />
      ) : (
        t('logPeriod', { months })
      ),
  }));
  const labels = {
    items: t('colItems'),
    purpose: t('colPurpose'),
    period: t('colPeriod'),
  };

  return (
    <div id={id} className="flex flex-col gap-3 text-body-sm">
      <ul
        aria-label={t('caption')}
        className="flex flex-col divide-y divide-border rounded-xl bg-surface px-3.5 md:hidden"
      >
        {rows.map((row) => (
          <li key={row.key} className="py-3">
            <dl className="flex flex-col gap-1.5">
              <SummaryField label={labels.items} value={row.items} />
              <SummaryField label={labels.purpose} value={row.purpose} />
              <SummaryField label={labels.period} value={row.period} />
            </dl>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-hidden rounded-xl border border-border md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{t('caption')}</caption>
          <thead className="bg-surface">
            <tr>
              {Object.values(labels).map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-3 py-2.5 text-label-bold text-text-secondary"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.key}>
                <th
                  scope="row"
                  className="px-3 py-2.5 align-top text-label-bold"
                >
                  {row.items}
                </th>
                <td className="px-3 py-2.5 align-top">{row.purpose}</td>
                <td className="px-3 py-2.5 align-top">{row.period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-body-sm text-text-primary">{t('refuse')}</p>
      <p className="text-body-sm text-text-secondary">{t('separate')}</p>
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-caption-strong text-text-secondary">{label}</dt>
      <dd className="text-body-sm text-text-primary">{value}</dd>
    </div>
  );
}
