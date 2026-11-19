const BATCH_STATUSES = [
  'COMPLETED',
  'STARTING',
  'STARTED',
  'STOPPING',
  'STOPPED',
  'FAILED',
  'ABANDONED',
  'UNKNOWN',
] as const;

type BatchStatusKey = (typeof BATCH_STATUSES)[number] | 'none';
export type BatchTone = 'positive' | 'warning' | 'running';

const RUNNING = new Set<string>(['STARTING', 'STARTED', 'STOPPING']);

/** Spring Batch의 BatchStatus 이름. 모르는 값은 UNKNOWN으로 다룬다. */
export function batchStatusKey(status: string | null): BatchStatusKey {
  if (status === null) return 'none';
  return BATCH_STATUSES.find((candidate) => candidate === status) ?? 'UNKNOWN';
}

export function batchStatusTone(status: string | null): BatchTone {
  if (status === 'COMPLETED') return 'positive';
  if (status !== null && RUNNING.has(status)) return 'running';
  return 'warning';
}

const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

/** 배치 시각은 시간대 없는 LocalDateTime이라, 기록된 벽시계 그대로 보이도록 UTC로 읽고 UTC로 포맷한다. */
export function parseBatchTime(value: string | null): Date | null {
  if (!value || !LOCAL_DATE_TIME.test(value)) return null;
  const date = new Date(`${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function batchDuration(start: Date | null, end: Date | null) {
  if (!start || !end) return null;
  const totalSeconds = Math.round((end.getTime() - start.getTime()) / 1000);
  if (totalSeconds < 0) return null;
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
  };
}
