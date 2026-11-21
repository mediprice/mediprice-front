import { z } from 'zod';

import { CLAIM_REASONS } from './schemas';

const REVIEW_STATUSES = [
  'ACTIVE',
  'HIDDEN',
  'TEMPORARILY_HIDDEN',
  'DELETED',
] as const;

const reasonsSchema = z
  .array(z.unknown())
  .transform((values) =>
    CLAIM_REASONS.filter((reason) => values.includes(reason)),
  );

const temporaryMeasureSchema = z.object({
  hiddenUntil: z.iso.datetime({ offset: true }),
  reasons: reasonsSchema,
  objectionAvailable: z.boolean(),
});

/** 모르는 상태는 공개로 보지 않는다. 임시조치 정보가 깨져 있으면 없는 것으로 본다. */
const moderationSchema = z.object({
  status: z.enum(REVIEW_STATUSES).catch('HIDDEN'),
  temporaryMeasure: temporaryMeasureSchema.nullable().catch(null).default(null),
});

export type TemporaryMeasure = z.infer<typeof temporaryMeasureSchema>;
export type ReviewModeration = z.infer<typeof moderationSchema>;

/** 생성 타입(schema.d.ts)에 아직 없는 TEMPORARILY_HIDDEN·DELETED와 temporaryMeasure를 응답 원본에서 읽는다. 배포 후 생성 타입으로 바꾼다. */
export function readReviewModeration(review: object): ReviewModeration {
  return moderationSchema.parse(review);
}

export type MeasurePhase =
  { kind: 'hiddenUntil'; until: Date } | { kind: 'reviewing' };

/** 기한이 지나도 운영자가 처리하기 전까지는 계속 가려 두므로(EXPIRED_PENDING) 그때는 "검토 중"으로 보여 준다. */
export function measurePhase(
  measure: TemporaryMeasure,
  now: Date,
): MeasurePhase {
  const until = new Date(measure.hiddenUntil);
  return until.getTime() > now.getTime()
    ? { kind: 'hiddenUntil', until }
    : { kind: 'reviewing' };
}
