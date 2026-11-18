import { z } from 'zod';

import { ApiError } from '@/lib/api/errors';
import type { components } from '@/lib/api/schema';

const REVIEW_CONTENT_MIN = 10;
export const REVIEW_CONTENT_MAX = 2000;
export const REPORT_DETAIL_MAX = 500;

/** 백엔드는 1자부터 받지만 S-14 시안대로 10자 이상을 받는다. 메시지는 reviews.form.errors의 키다. */
export const reviewFormSchema = z.object({
  rating: z
    .number('ratingRequired')
    .int('ratingRequired')
    .min(1, 'ratingRequired')
    .max(5, 'ratingRequired'),
  content: z
    .string()
    .trim()
    .min(REVIEW_CONTENT_MIN, 'contentTooShort')
    .max(REVIEW_CONTENT_MAX, 'contentTooLong'),
});

export type ReviewFormInput = z.input<typeof reviewFormSchema>;
export type ReviewForm = z.output<typeof reviewFormSchema>;
export type ReviewFormField = keyof ReviewForm;
export type ReviewFormErrorKey =
  'ratingRequired' | 'contentTooShort' | 'contentTooLong' | 'invalid';

export function reviewFormErrorKey(
  message: string | undefined,
): ReviewFormErrorKey {
  return message === 'ratingRequired' ||
    message === 'contentTooShort' ||
    message === 'contentTooLong'
    ? message
    : 'invalid';
}

export type ReportReason =
  components['schemas']['ReviewReportRequest']['reason'];

/** 화면에 보이는 순서. 시안의 네 가지에 백엔드의 허위 정보를 더했다. */
export const REPORT_REASONS = [
  'PRIVACY',
  'SPAM',
  'ABUSE',
  'FALSE_INFO',
  'ETC',
] as const satisfies readonly ReportReason[];

export const reportFormSchema = z.object({
  reason: z.enum(REPORT_REASONS, 'reasonRequired'),
  detail: z.string().trim().max(REPORT_DETAIL_MAX, 'detailTooLong'),
});

export type ReportFormInput = z.input<typeof reportFormSchema>;
export type ReportForm = z.output<typeof reportFormSchema>;

/** INVALID_INPUT의 fieldErrors 중 폼에 있는 칸만 골라 setError에 넘길 이름으로 돌려준다. 백엔드 reason 문구는 쓰지 않는다. */
export function invalidFields<F extends string>(
  error: unknown,
  fields: readonly F[],
): F[] {
  if (!(error instanceof ApiError) || error.code !== 'INVALID_INPUT') {
    return [];
  }
  const known = new Set<string>(fields);
  const matched = error.fieldErrors
    .map((fieldError) => fieldError.field.split('.').at(-1) ?? '')
    .filter((field): field is F => known.has(field));
  return [...new Set(matched)];
}

export const REVIEW_FORM_FIELDS = [
  'rating',
  'content',
] as const satisfies readonly ReviewFormField[];

export const REPORT_FORM_FIELDS = [
  'reason',
  'detail',
] as const satisfies readonly (keyof ReportForm)[];
