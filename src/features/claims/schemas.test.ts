import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api/errors';

import {
  claimFormErrorKey,
  claimFormSchema,
  claimInvalidFields,
  objectionFormSchema,
} from './schemas';

const valid = {
  reason: 'DEFAMATION',
  description: '  병원 이름과 함께 사실이 아닌 내용을 적었어요.  ',
  claimantRole: 'HOSPITAL',
  claimantName: ' 홍길동 ',
  claimantEmail: ' claim@example.com ',
  agreement: true,
};

/** 폼(zodResolver)처럼 칸마다 첫 오류만 본다. */
function errorKeys(input: unknown) {
  const result = claimFormSchema.safeParse(input);
  const keys: Record<string, string> = {};
  for (const issue of result.error?.issues ?? []) {
    const field = String(issue.path[0]);
    keys[field] ??= issue.message;
  }
  return keys;
}

describe('claimFormSchema', () => {
  it('앞뒤 공백을 지운 값으로 통과한다', () => {
    expect(claimFormSchema.parse(valid)).toEqual({
      reason: 'DEFAMATION',
      description: '병원 이름과 함께 사실이 아닌 내용을 적었어요.',
      claimantRole: 'HOSPITAL',
      claimantName: '홍길동',
      claimantEmail: 'claim@example.com',
      agreement: true,
    });
  });

  it('빈 양식은 칸마다 필요한 오류 키를 준다', () => {
    expect(
      errorKeys({
        description: '   ',
        claimantName: '',
        claimantEmail: '',
        agreement: false,
      }),
    ).toEqual({
      reason: 'reasonRequired',
      description: 'descriptionRequired',
      claimantRole: 'roleRequired',
      claimantName: 'nameRequired',
      claimantEmail: 'emailRequired',
      agreement: 'agreementRequired',
    });
  });

  it('백엔드와 같은 길이 제한을 둔다', () => {
    expect(
      errorKeys({
        ...valid,
        description: '가'.repeat(2001),
        claimantName: '가'.repeat(51),
        claimantEmail: `${'a'.repeat(250)}@x.kr`,
      }),
    ).toEqual({
      description: 'descriptionTooLong',
      claimantName: 'nameTooLong',
      claimantEmail: 'emailTooLong',
    });
    expect(
      claimFormSchema.safeParse({ ...valid, description: '가'.repeat(2000) })
        .success,
    ).toBe(true);
  });

  it.each(['claim', 'claim@', 'claim@example', 'a b@example.com'])(
    '이메일 형식이 아니면(%s) emailInvalid다',
    (claimantEmail) => {
      expect(errorKeys({ ...valid, claimantEmail })).toEqual({
        claimantEmail: 'emailInvalid',
      });
    },
  );

  it('모르는 사유·구분은 받지 않는다', () => {
    expect(
      errorKeys({ ...valid, reason: 'SPAM', claimantRole: 'USER' }),
    ).toEqual({ reason: 'reasonRequired', claimantRole: 'roleRequired' });
  });
});

describe('objectionFormSchema', () => {
  it('공백만 있거나 2,000자를 넘으면 막는다', () => {
    expect(
      objectionFormSchema.safeParse({ content: '  ' }).error?.issues[0]
        ?.message,
    ).toBe('contentRequired');
    expect(
      objectionFormSchema.safeParse({ content: '가'.repeat(2001) }).error
        ?.issues[0]?.message,
    ).toBe('contentTooLong');
    expect(objectionFormSchema.parse({ content: ' 사실이에요 ' })).toEqual({
      content: '사실이에요',
    });
  });
});

describe('claimFormErrorKey', () => {
  it('아는 키는 그대로, 모르는 값은 invalid로 바꾼다', () => {
    expect(claimFormErrorKey('emailInvalid')).toBe('emailInvalid');
    expect(claimFormErrorKey('must be a well-formed email address')).toBe(
      'invalid',
    );
    expect(claimFormErrorKey(undefined)).toBe('invalid');
  });
});

describe('claimInvalidFields', () => {
  it('INVALID_INPUT의 fieldErrors 중 양식에 있는 칸만 고른다', () => {
    const error = new ApiError(400, 'INVALID_INPUT', '잘못됨', [
      { field: 'claimantEmail', reason: 'must be a well-formed email address' },
      { field: 'request.description', reason: 'must not be blank' },
      { field: 'privacyNoticeVersion', reason: 'must not be blank' },
      { field: 'claimantEmail', reason: 'size must be between 0 and 254' },
    ]);
    expect(claimInvalidFields(error)).toEqual(['claimantEmail', 'description']);
  });

  it('다른 오류는 칸 오류가 아니다', () => {
    expect(
      claimInvalidFields(new ApiError(429, 'CLAIM_RATE_LIMITED', '')),
    ).toEqual([]);
    expect(claimInvalidFields(new Error('x'))).toEqual([]);
  });
});
