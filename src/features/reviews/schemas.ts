import { z } from 'zod';

import { ApiError } from '@/lib/api/errors';
import type { components } from '@/lib/api/schema';

const REVIEW_CONTENT_MIN = 10;
export const REVIEW_CONTENT_MAX = 2000;
export const REPORT_DETAIL_MAX = 500;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** 실수로 자릿수를 더 넣은 값을 막는 상한(1억 원). 백엔드는 0 이상만 검사한다. */
const PAID_AMOUNT_MAX = 100_000_000;
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 백엔드가 방문일을 한국 시간 기준 오늘까지만 받는다. 서울은 서머타임이 없어 9시간을 더해 날짜만 뗀다. */
export function todayInSeoul(now = Date.now()) {
  return new Date(now + SEOUL_OFFSET_MS).toISOString().slice(0, 10);
}

export type ReviewFormErrorKey =
  | 'ratingRequired'
  | 'contentTooShort'
  | 'contentTooLong'
  | 'visitedOnInvalid'
  | 'visitedOnFuture'
  | 'paidAmountInvalid'
  | 'cannotClear'
  | 'invalid';

/**
 * 백엔드는 내용을 1자부터 받지만 S-14 시안대로 10자 이상을 받는다. 메시지는 reviews.form.errors의 키다.
 * PATCH는 빈 값을 "바꾸지 않음"으로 보므로, 수정할 때 이미 있는 방문일·결제 금액은 지울 수 없다(keep).
 */
export function buildReviewFormSchema({
  today = todayInSeoul(),
  keep = { visitedOn: false, paidAmount: false },
}: {
  today?: string;
  keep?: { visitedOn: boolean; paidAmount: boolean };
} = {}) {
  return z.object({
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
    visitedOn: z
      .string()
      .trim()
      .refine((value) => value !== '' || !keep.visitedOn, 'cannotClear')
      .refine(
        (value) => value === '' || ISO_DATE.test(value),
        'visitedOnInvalid',
      )
      .refine(
        (value) => !ISO_DATE.test(value) || value <= today,
        'visitedOnFuture',
      )
      .transform((value) => value || undefined),
    paidAmount: z
      .string()
      /** 쉼표·공백과 끝에 붙인 "원"(\uC6D0)은 지우고 숫자만 본다. */
      .transform((value) => value.replace(/[\s,\uC6D0]/g, ''))
      .refine((value) => value !== '' || !keep.paidAmount, 'cannotClear')
      .refine(
        (value) =>
          value === '' ||
          (/^\d{1,9}$/.test(value) && Number(value) <= PAID_AMOUNT_MAX),
        'paidAmountInvalid',
      )
      .transform((value) => (value === '' ? undefined : Number(value))),
  });
}

type ReviewFormSchema = ReturnType<typeof buildReviewFormSchema>;
export type ReviewFormInput = z.input<ReviewFormSchema>;
export type ReviewForm = z.output<ReviewFormSchema>;
export type ReviewFormField = keyof ReviewForm;

const REVIEW_FORM_ERROR_KEYS = new Set<string>([
  'ratingRequired',
  'contentTooShort',
  'contentTooLong',
  'visitedOnInvalid',
  'visitedOnFuture',
  'paidAmountInvalid',
  'cannotClear',
]);

function isReviewFormErrorKey(message: string): message is ReviewFormErrorKey {
  return REVIEW_FORM_ERROR_KEYS.has(message);
}

export function reviewFormErrorKey(
  message: string | undefined,
): ReviewFormErrorKey {
  return message && isReviewFormErrorKey(message) ? message : 'invalid';
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
  'visitedOn',
  'paidAmount',
] as const satisfies readonly ReviewFormField[];

export const REPORT_FORM_FIELDS = [
  'reason',
  'detail',
] as const satisfies readonly (keyof ReportForm)[];
