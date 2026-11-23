import { describe, expect, it } from 'vitest';

import { isShownReason, withoutNotice } from './result-text';

const NOTICE =
  '건강보험이 적용되는 진료비(진찰료 등)는 포함되지 않은 비급여 가격이에요.';

describe('withoutNotice', () => {
  it('답 끝에 붙은 고지를 뺀다', () => {
    expect(
      withoutNotice(
        `허리 통증과 관련된 항목이에요. 서울 강남구 기준으로 병원별 공개 가격을 보여 드릴게요. ${NOTICE}`,
        NOTICE,
      ),
    ).toBe(
      '허리 통증과 관련된 항목이에요. 서울 강남구 기준으로 병원별 공개 가격을 보여 드릴게요.',
    );
  });

  it('고지가 없거나 문구가 다르면 그대로 둔다', () => {
    expect(withoutNotice('관련 항목이에요.', NOTICE)).toBe('관련 항목이에요.');
    expect(withoutNotice('관련 항목이에요. 비급여 가격이에요.', NOTICE)).toBe(
      '관련 항목이에요. 비급여 가격이에요.',
    );
  });

  it('줄바꿈은 남긴다', () => {
    expect(withoutNotice(`첫 줄\n둘째 줄 ${NOTICE}`, NOTICE)).toBe(
      '첫 줄\n둘째 줄',
    );
  });
});

describe('isShownReason', () => {
  it('사용자를 3인칭으로 부르는 판정 메모는 숨긴다', () => {
    expect(isShownReason('사용자가 요청한 도수치료 항목과 일치함')).toBe(false);
    expect(isShownReason('  ')).toBe(false);
  });

  it('상황과 항목의 관련을 설명하는 이유는 보여 준다', () => {
    expect(isShownReason('허리 통증과 관련된 항목이에요.')).toBe(true);
  });
});
