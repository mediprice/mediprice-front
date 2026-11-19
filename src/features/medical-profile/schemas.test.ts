import { describe, expect, it } from 'vitest';

import type { MedicalProfile } from './queries';
import {
  createMedicalProfileSchema,
  hasCurrentConsent,
  MEDICAL_CONSENT_VERSION,
  medicalProfileErrorKey,
  type MedicalProfileForm,
  toFormField,
  toMedicalProfileForm,
  toMedicalProfileRequest,
} from './schemas';

const schema = createMedicalProfileSchema(2026);

const valid: MedicalProfileForm = {
  consent: true,
  birthYear: '1985',
  gender: 'MALE',
  chronicConditions: '고혈압',
  medications: '',
  allergies: '',
  note: '',
};

function firstMessage(form: MedicalProfileForm, path: string) {
  const result = schema.safeParse(form);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === path)?.message;
}

describe('createMedicalProfileSchema', () => {
  it('올바른 값과 모두 빈 값을 받아들인다', () => {
    expect(schema.safeParse(valid).success).toBe(true);
    expect(
      schema.safeParse({ ...toMedicalProfileForm(null), consent: true })
        .success,
    ).toBe(true);
  });

  it('동의하지 않으면 저장할 수 없다', () => {
    expect(firstMessage({ ...valid, consent: false }, 'consent')).toBe(
      'consentRequired',
    );
  });

  it.each([
    ['85', 'birthYearFormat'],
    ['198a', 'birthYearFormat'],
    ['1899', 'birthYearRange'],
    ['2027', 'birthYearRange'],
  ])('출생 연도 %s는 %s 오류다', (birthYear, message) => {
    expect(firstMessage({ ...valid, birthYear }, 'birthYear')).toBe(message);
  });

  it('올해와 1900년은 경계값으로 받아들인다', () => {
    expect(schema.safeParse({ ...valid, birthYear: '2026' }).success).toBe(
      true,
    );
    expect(schema.safeParse({ ...valid, birthYear: ' 1900 ' }).success).toBe(
      true,
    );
  });

  it('글은 앞뒤 공백을 빼고 1,000자까지다', () => {
    expect(
      schema.safeParse({ ...valid, note: ` ${'가'.repeat(1000)} ` }).success,
    ).toBe(true);
    expect(firstMessage({ ...valid, note: '가'.repeat(1001) }, 'note')).toBe(
      'tooLong',
    );
  });
});

describe('toMedicalProfileForm', () => {
  it('저장한 적이 없으면 빈 폼이고 동의하지 않은 상태다', () => {
    expect(toMedicalProfileForm(null)).toEqual({
      consent: false,
      birthYear: '',
      gender: '',
      chronicConditions: '',
      medications: '',
      allergies: '',
      note: '',
    });
  });

  it('이전 버전에 동의했거나 동의 기록이 없는 프로필은 다시 동의를 받는다', () => {
    const base: MedicalProfile = {
      birthYear: null,
      gender: null,
      chronicConditions: null,
      medications: null,
      allergies: null,
      note: null,
      updatedAt: '2026-10-12T01:00:00Z',
    };

    expect(
      toMedicalProfileForm({ ...base, consentVersion: '2026-01-01' }).consent,
    ).toBe(false);
    expect(
      toMedicalProfileForm({ ...base, consentVersion: null, consentedAt: null })
        .consent,
    ).toBe(false);
    expect(
      toMedicalProfileForm({
        ...base,
        consentVersion: MEDICAL_CONSENT_VERSION,
        consentedAt: '2026-11-19T01:00:00Z',
      }).consent,
    ).toBe(true);
  });

  it('동의 값을 모르는 예전 백엔드의 프로필은 저장돼 있으면 동의한 것으로 본다', () => {
    expect(hasCurrentConsent(null)).toBe(false);
    expect(
      hasCurrentConsent({
        birthYear: null,
        gender: null,
        chronicConditions: null,
        medications: null,
        allergies: null,
        note: null,
        updatedAt: '2026-10-12T01:00:00Z',
      }),
    ).toBe(true);
  });

  it('저장한 프로필은 동의한 상태로 채우고 모르는 성별 값은 비운다', () => {
    const profile: MedicalProfile = {
      birthYear: 1990,
      gender: 'OTHER',
      chronicConditions: null,
      medications: '혈압약',
      allergies: null,
      note: null,
      updatedAt: '2026-10-12T01:00:00Z',
    };

    expect(toMedicalProfileForm(profile)).toMatchObject({
      consent: true,
      birthYear: '1990',
      gender: '',
      medications: '혈압약',
      allergies: '',
    });
  });
});

describe('toMedicalProfileRequest', () => {
  it('빈 칸은 빼고 글은 앞뒤 공백을 지워 보낸다', () => {
    expect(
      toMedicalProfileRequest({
        ...valid,
        birthYear: ' 1985 ',
        gender: '',
        allergies: '  ',
        note: ' 메모 ',
      }),
    ).toEqual({
      birthYear: 1985,
      chronicConditions: '고혈압',
      note: '메모',
      consentVersion: MEDICAL_CONSENT_VERSION,
    });
  });
});

describe('오류 키', () => {
  it('스키마 메시지는 그대로, 나머지는 invalid로 바꾼다', () => {
    expect(medicalProfileErrorKey('tooLong')).toBe('tooLong');
    expect(medicalProfileErrorKey('invalid')).toBe('invalid');
    expect(medicalProfileErrorKey(undefined)).toBe('invalid');
  });

  it('백엔드 칸 이름을 폼 칸으로 바꾼다', () => {
    expect(toFormField('birthYear')).toBe('birthYear');
    expect(toFormField('allergies')).toBe('allergies');
    expect(toFormField('userId')).toBeNull();
  });
});
