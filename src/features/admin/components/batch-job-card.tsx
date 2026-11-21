'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { StatusChip } from '@/components/ui/status-chip';
import { Tag } from '@/components/ui/tag';

import {
  batchDuration,
  batchStatusKey,
  batchStatusTone,
  parseBatchTime,
} from '../batch-status';
import type { BatchJob } from '../queries';

function BatchStatusLabel({ status }: { status: string | null }) {
  const t = useTranslations('admin.batch.status');
  const tone = batchStatusTone(status);
  const label = t(batchStatusKey(status));
  return tone === 'running' ? (
    <Tag>{label}</Tag>
  ) : (
    <StatusChip status={tone}>{label}</StatusChip>
  );
}

/** Job 하나의 최근 실행. 실패했거나 종료 메시지가 있으면 원문을 접어서 둔다. */
export function BatchJobCard({ job }: { job: BatchJob }) {
  const t = useTranslations('admin.batch');
  const format = useFormatter();
  const start = parseBatchTime(job.startTime);
  const end = parseBatchTime(job.endTime);
  const duration = batchDuration(start, end);
  /** 기록된 벽시계를 그대로 보이게 한다(parseBatchTime). */
  const formatTime = (date: Date) =>
    format.dateTime(date, 'dateTime', { timeZone: 'UTC' });

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 className="min-w-0 text-subheading wrap-anywhere">{job.jobName}</h3>
        <BatchStatusLabel status={job.status} />
        <span className="text-caption text-text-secondary tabular-nums">
          {t('execution', { id: job.executionId })}
        </span>
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-body-sm tabular-nums">
        <dt className="text-text-secondary">{t('started')}</dt>
        <dd>{start ? formatTime(start) : '–'}</dd>
        <dt className="text-text-secondary">{t('ended')}</dt>
        <dd>{end ? formatTime(end) : t('notEnded')}</dd>
        {duration && (
          <>
            <dt className="text-text-secondary">{t('duration')}</dt>
            <dd>
              {duration.minutes > 0
                ? t('durationMinutes', duration)
                : t('durationSeconds', duration)}
            </dd>
          </>
        )}
      </dl>
      {job.steps.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h4 className="text-label-bold text-text-secondary">{t('steps')}</h4>
          <ul className="flex flex-col divide-y divide-hairline rounded-xl bg-surface px-3">
            {job.steps.map((step) => (
              <li
                key={step.stepName}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2"
              >
                <span className="min-w-0 flex-1 text-body-sm wrap-anywhere">
                  {step.stepName}
                </span>
                <BatchStatusLabel status={step.status} />
                <span className="w-full text-caption text-text-secondary tabular-nums md:w-auto">
                  {t('stepCounts', {
                    read: step.readCount,
                    write: step.writeCount,
                    skip: step.skipCount,
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {(job.exitMessage || batchStatusTone(job.status) === 'warning') && (
        <details className="rounded-xl bg-surface px-3 py-2">
          <summary className="flex min-h-11 cursor-pointer items-center text-label">
            {t('exitMessage')}
          </summary>
          <div className="flex flex-col gap-1 pb-2">
            <p className="flex flex-wrap gap-x-2 text-body-sm">
              <span className="text-text-secondary">{t('exitCode')}</span>
              <span className="wrap-anywhere">{job.exitCode ?? '–'}</span>
            </p>
            {job.exitMessage && (
              <p className="max-h-48 overflow-auto text-caption wrap-anywhere whitespace-pre-wrap">
                {job.exitMessage}
              </p>
            )}
          </div>
        </details>
      )}
    </article>
  );
}
