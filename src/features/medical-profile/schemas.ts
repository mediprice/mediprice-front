import { z } from 'zod';

import type { MedicalProfile, MedicalProfileRequest } from './queries';

/** 백엔드 MedicalProfileRequest의 글자 수 상한. */
export const TEXT_MAX_LENGTH = 1000;
const BIRTH_YEAR_MIN = 1900;

export const TEXT_FIELDS = [
  'chronicConditions',
  'medications',
  'allergies',
  'note',
] as const;

export type Gender = '' | 'MALE' | 'FEMALE';

const text = z
  .string()
  .refine((value) => value.trim().length <= TEXT_MAX_LENGTH, 'tooLong');

/** 메시지는 library.medicalProfile.errors의 키다. 올해는 인자로 받아 테스트에서 고정한다. */
export function createMedicalProfileSchema(currentYear: number) {
  return z.object({
    consent: z.boolean().refine((value) => value, 'consentRequired'),
    birthYear: z
      .string()
      .trim()
      .superRefine((value, context) => {
        if (value === '') return;
        if (!/^\d{4}$/.test(value)) {
          context.addIssue({ code: 'custom', message: 'birthYearFormat' });
          return;
        }
        const year = Number(value);
        if (year < BIRTH_YEAR_MIN || year > currentYear) {
          context.addIssue({ code: 'custom', message: 'birthYearRange' });
        }
      }),
    gender: z.enum(['', 'MALE', 'FEMALE']),
    chronicConditions: text,
    medications: text,
    allergies: text,
    note: text,
  });
}

export type MedicalProfileForm = z.infer<
  ReturnType<typeof createMedicalProfileSchema>
>;

const SCHEMA_ERROR_KEYS = [
  'consentRequired',
  'birthYearFormat',
  'birthYearRange',
  'tooLong',
] as const;

export type MedicalProfileErrorKey =
  (typeof SCHEMA_ERROR_KEYS)[number] | 'invalid';

/** 서버 검증 실패(setError의 'invalid')와 모르는 메시지는 'invalid'다. */
export function medicalProfileErrorKey(
  message: string | undefined,
): MedicalProfileErrorKey {
  return SCHEMA_ERROR_KEYS.find((key) => key === message) ?? 'invalid';
}

function toGender(value: string | null): Gender {
  return value === 'MALE' || value === 'FEMALE' ? value : '';
}

/** 저장한 프로필이 있으면 이미 동의한 것이라 동의 칸을 채워 둔다. */
export function toMedicalProfileForm(
  profile: MedicalProfile | null,
): MedicalProfileForm {
  return {
    consent: profile !== null,
    birthYear: profile?.birthYear?.toString() ?? '',
    gender: toGender(profile?.gender ?? null),
    chronicConditions: profile?.chronicConditions ?? '',
    medications: profile?.medications ?? '',
    allergies: profile?.allergies ?? '',
    note: profile?.note ?? '',
  };
}

/** PUT은 통째로 바꾸므로 빈 칸은 보내지 않아 서버에서 비워지게 한다. */
export function toMedicalProfileRequest(
  form: MedicalProfileForm,
): MedicalProfileRequest {
  const request: MedicalProfileRequest = {};
  const birthYear = form.birthYear.trim();
  if (birthYear) request.birthYear = Number(birthYear);
  if (form.gender) request.gender = form.gender;
  for (const field of TEXT_FIELDS) {
    const value = form[field].trim();
    if (value) request[field] = value;
  }
  return request;
}

/** 백엔드 INVALID_INPUT의 field를 폼 칸 이름으로 바꾼다. 모르는 칸이면 null이다. */
export function toFormField(
  field: string,
): Exclude<keyof MedicalProfileForm, 'consent'> | null {
  if (field === 'birthYear' || field === 'gender') return field;
  return TEXT_FIELDS.find((name) => name === field) ?? null;
}
