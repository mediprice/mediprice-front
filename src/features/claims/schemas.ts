import { z } from 'zod';

import { ApiError } from '@/lib/api/errors';

/** 화면에 보이는 순서. 값은 백엔드 ClaimantRole·ClaimReason과 같다. */
export const CLAIMANT_ROLES = ['SELF', 'HOSPITAL', 'AGENT'] as const;
export const CLAIM_REASONS = [
  'DEFAMATION',
  'PRIVACY',
  'FALSE_FACT',
  'COPYRIGHT',
  'OTHER',
] as const;

export const CLAIMANT_NAME_MAX = 50;
export const CLAIMANT_EMAIL_MAX = 254;
export const CLAIM_DESCRIPTION_MAX = 2000;
export const OBJECTION_CONTENT_MAX = 2000;

/** 백엔드 @Email(regexp)와 같은 규칙이다. */
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const claimFormSchema = z.object({
  reason: z.enum(CLAIM_REASONS, 'reasonRequired'),
  description: z
    .string()
    .trim()
    .min(1, 'descriptionRequired')
    .max(CLAIM_DESCRIPTION_MAX, 'descriptionTooLong'),
  claimantRole: z.enum(CLAIMANT_ROLES, 'roleRequired'),
  claimantName: z
    .string()
    .trim()
    .min(1, 'nameRequired')
    .max(CLAIMANT_NAME_MAX, 'nameTooLong'),
  claimantEmail: z
    .string()
    .trim()
    .min(1, 'emailRequired')
    .max(CLAIMANT_EMAIL_MAX, 'emailTooLong')
    .regex(EMAIL_PATTERN, 'emailInvalid'),
  agreement: z.boolean().refine((value) => value, 'agreementRequired'),
});

export type ClaimFormInput = z.input<typeof claimFormSchema>;
export type ClaimForm = z.output<typeof claimFormSchema>;

const CLAIM_FORM_FIELDS = [
  'reason',
  'description',
  'claimantRole',
  'claimantName',
  'claimantEmail',
  'agreement',
] as const satisfies readonly (keyof ClaimForm)[];

export const objectionFormSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'contentRequired')
    .max(OBJECTION_CONTENT_MAX, 'contentTooLong'),
});

export type ObjectionForm = z.output<typeof objectionFormSchema>;

const CLAIM_FORM_ERROR_KEYS = [
  'reasonRequired',
  'descriptionRequired',
  'descriptionTooLong',
  'roleRequired',
  'nameRequired',
  'nameTooLong',
  'emailRequired',
  'emailTooLong',
  'emailInvalid',
  'agreementRequired',
  'contentRequired',
  'contentTooLong',
] as const;

export type ClaimFormErrorKey =
  (typeof CLAIM_FORM_ERROR_KEYS)[number] | 'invalid';

/** zod 메시지(키)를 claims.errors의 키로 바꾼다. 서버 fieldErrors처럼 모르는 값은 invalid다. */
export function claimFormErrorKey(
  message: string | undefined,
): ClaimFormErrorKey {
  return CLAIM_FORM_ERROR_KEYS.find((key) => key === message) ?? 'invalid';
}

type ClaimFormField = (typeof CLAIM_FORM_FIELDS)[number];

/** INVALID_INPUT의 fieldErrors 중 신고 양식에 있는 칸만 고른다. 백엔드 reason 문구는 쓰지 않는다. */
export function claimInvalidFields(error: unknown): ClaimFormField[] {
  if (!(error instanceof ApiError) || error.code !== 'INVALID_INPUT') return [];
  const fields = error.fieldErrors
    .map((fieldError) => fieldError.field.split('.').at(-1) ?? '')
    .flatMap((name) => CLAIM_FORM_FIELDS.filter((field) => field === name));
  return [...new Set(fields)];
}
