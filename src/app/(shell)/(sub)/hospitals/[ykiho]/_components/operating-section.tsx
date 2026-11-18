import { useFormatter, useTranslations } from 'next-intl';

import { summarizeOperatingInfo } from '@/features/hospitals/operating-hours';
import type { components } from '@/lib/api/schema';

import { InfoTable } from './info-table';

type Hospital = components['schemas']['HospitalDetailResponse'];
type Row = Parameters<typeof InfoTable>[0]['rows'][number];

export function OperatingSection({ hospital }: { hospital: Hospital }) {
  const t = useTranslations('hospitals.detail');
  const format = useFormatter();
  const summary = summarizeOperatingInfo(hospital.operatingInfo);

  const hourRows: Row[] = [];
  const infoRows: Row[] = [];

  if (summary && !summary.isEmpty) {
    for (const group of summary.hours) {
      const from = t(`hours.days.${group.from}`);
      hourRows.push({
        key: group.from,
        label:
          group.from === group.to
            ? from
            : t('hours.dayRange', { from, to: t(`hours.days.${group.to}`) }),
        value: (
          <span className="tabular-nums">
            {t('hours.range', { start: group.start, end: group.end })}
          </span>
        ),
      });
    }
    if (summary.closed.sunday) {
      hourRows.push({
        key: 'sunday',
        label: t('hours.sunday'),
        value: summary.closed.sunday,
      });
    }
    if (summary.closed.holiday) {
      hourRows.push({
        key: 'holiday',
        label: t('hours.holiday'),
        value: summary.closed.holiday,
      });
    }

    const pair = (value: { weekday?: string; saturday?: string }) =>
      [
        value.weekday && t('info.weekday', { value: value.weekday }),
        value.saturday && t('info.saturday', { value: value.saturday }),
      ]
        .filter(Boolean)
        .map((line) => (
          <span key={String(line)} className="block">
            {line}
          </span>
        ));

    if (summary.lunch.weekday || summary.lunch.saturday) {
      infoRows.push({
        key: 'lunch',
        label: t('info.lunch'),
        value: pair(summary.lunch),
      });
    }
    if (summary.reception.weekday || summary.reception.saturday) {
      infoRows.push({
        key: 'reception',
        label: t('info.reception'),
        value: pair(summary.reception),
      });
    }
    const { parking } = summary;
    if (parking.count || parking.isPaid !== undefined || parking.note) {
      const head = [
        parking.count && t('info.parkingCount', { count: parking.count }),
        parking.isPaid !== undefined &&
          (parking.isPaid ? t('info.parkingPaid') : t('info.parkingFree')),
      ]
        .filter(Boolean)
        .join(' · ');
      infoRows.push({
        key: 'parking',
        label: t('info.parking'),
        value: (
          <>
            {head && <span className="block">{head}</span>}
            {parking.note && (
              <span className="block text-caption text-text-secondary">
                {parking.note}
              </span>
            )}
          </>
        ),
      });
    }
    if (summary.emergency.isDay || summary.emergency.isNight) {
      infoRows.push({
        key: 'emergency',
        label: t('info.emergency'),
        value: [
          summary.emergency.isDay && t('info.emergencyDay'),
          summary.emergency.isNight && t('info.emergencyNight'),
        ]
          .filter(Boolean)
          .join(' · '),
      });
    }
  }

  if (hospital.openedDate) {
    infoRows.push({
      key: 'opened',
      label: t('info.opened'),
      value: format.dateTime(new Date(hospital.openedDate), 'date'),
    });
  }

  return (
    <section
      id="hours"
      aria-labelledby="hours-title"
      className="flex scroll-mt-14 flex-col gap-4"
    >
      <h2 id="hours-title" className="text-heading">
        {t('hours.title')}
      </h2>
      {hourRows.length > 0 ? (
        <InfoTable rows={hourRows} />
      ) : (
        <p className="rounded-xl bg-surface px-5 py-4 text-body-sm text-text-secondary lg:px-6">
          {t('hours.empty')}
        </p>
      )}
      {infoRows.length > 0 && (
        <>
          <h3 className="mt-2 text-subheading">{t('info.title')}</h3>
          <InfoTable rows={infoRows} />
        </>
      )}
      {(hourRows.length > 0 || infoRows.length > 0) && (
        <p className="text-caption text-text-secondary">{t('hours.notice')}</p>
      )}
    </section>
  );
}
