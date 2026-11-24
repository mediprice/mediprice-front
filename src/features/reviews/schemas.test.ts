import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api/errors';

import {
  buildReviewFormSchema,
  invalidFields,
  REPORT_FORM_FIELDS,
  reportFormSchema,
  REVIEW_FORM_FIELDS,
  reviewFormErrorKey,
  todayInSeoul,
} from './schemas';

function messagesOf(result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) {
  return Object.fromEntries(
    (result.error?.issues ?? []).map((issue) => [
      String(issue.path[0]),
      issue.message,
    ]),
  );
}

const reviewFormSchema = buildReviewFormSchema({ today: '2026-11-18' });
const BASE_FORM = { visitedOn: '', paidAmount: '' };

describe('reviewFormSchema', () => {
  it('별점이 없거나 범위를 벗어나면 ratingRequired다', () => {
    expect(
      messagesOf(
        reviewFormSchema.safeParse({
          ...BASE_FORM,
          content: '열 글자가 넘는 후기 내용',
        }),
      ),
    ).toEqual({ rating: 'ratingRequired' });
    expect(
      messagesOf(
        reviewFormSchema.safeParse({
          ...BASE_FORM,
          rating: 6,
          content: '열 글자가 넘는 후기 내용',
        }),
      ),
    ).toEqual({ rating: 'ratingRequired' });
  });

  it('앞뒤 공백을 빼고 10자 미만이면 contentTooShort, 2000자를 넘으면 contentTooLong이다', () => {
    expect(
      messagesOf(
        reviewFormSchema.safeParse({
          ...BASE_FORM,
          rating: 3,
          content: '   짧아요   ',
        }),
      ),
    ).toEqual({ content: 'contentTooShort' });
    expect(
      messagesOf(
        reviewFormSchema.safeParse({
          ...BASE_FORM,
          rating: 3,
          content: '가'.repeat(2001),
        }),
      ),
    ).toEqual({ content: 'contentTooLong' });
  });

  it('통과하면 내용의 앞뒤 공백을 지운다', () => {
    expect(
      reviewFormSchema.parse({
        ...BASE_FORM,
        rating: 5,
        content: '  친절하고 설명이 자세했어요  ',
      }),
    ).toEqual({
      rating: 5,
      content: '친절하고 설명이 자세했어요',
      visitedOn: undefined,
      paidAmount: undefined,
    });
  });

  it('방문일은 오늘(서울)까지만, 결제 금액은 쉼표를 빼고 1억 원 이하 정수만 받는다', () => {
    const valid = { rating: 4, content: '열 글자가 넘는 후기 내용' };
    expect(
      reviewFormSchema.parse({
        ...valid,
        visitedOn: '2026-11-18',
        paidAmount: '45,000원',
      }),
    ).toMatchObject({ visitedOn: '2026-11-18', paidAmount: 45000 });
    expect(
      messagesOf(
        reviewFormSchema.safeParse({
          ...valid,
          visitedOn: '2026-11-19',
          paidAmount: '-1',
        }),
      ),
    ).toEqual({
      visitedOn: 'visitedOnFuture',
      paidAmount: 'paidAmountInvalid',
    });
    expect(
      messagesOf(
        reviewFormSchema.safeParse({
          ...valid,
          visitedOn: '어제',
          paidAmount: '100000001',
        }),
      ),
    ).toEqual({
      visitedOn: 'visitedOnInvalid',
      paidAmount: 'paidAmountInvalid',
    });
  });

  it('수정할 때 이미 있던 방문일·결제 금액을 비우면 cannotClear다(PATCH가 지우지 못한다)', () => {
    const schema = buildReviewFormSchema({
      today: '2026-11-18',
      keep: { visitedOn: true, paidAmount: true },
    });
    expect(
      messagesOf(
        schema.safeParse({
          rating: 4,
          content: '열 글자가 넘는 후기 내용',
          visitedOn: '',
          paidAmount: ' ',
        }),
      ),
    ).toEqual({ visitedOn: 'cannotClear', paidAmount: 'cannotClear' });
  });

  it('서울 날짜는 UTC 15시부터 다음 날이다', () => {
    expect(todayInSeoul(Date.UTC(2026, 10, 18, 14, 59))).toBe('2026-11-18');
    expect(todayInSeoul(Date.UTC(2026, 10, 18, 15, 0))).toBe('2026-11-19');
  });

  it('모르는 메시지는 invalid 키로 바꾼다', () => {
    expect(reviewFormErrorKey('contentTooShort')).toBe('contentTooShort');
    expect(reviewFormErrorKey('invalid')).toBe('invalid');
    expect(reviewFormErrorKey(undefined)).toBe('invalid');
  });
});

describe('reportFormSchema', () => {
  it('사유가 없으면 reasonRequired, 설명이 500자를 넘으면 detailTooLong이다', () => {
    expect(messagesOf(reportFormSchema.safeParse({ detail: '' }))).toEqual({
      reason: 'reasonRequired',
    });
    expect(
      messagesOf(
        reportFormSchema.safeParse({ reason: 'ETC', detail: '가'.repeat(501) }),
      ),
    ).toEqual({ detail: 'detailTooLong' });
  });

  it('백엔드에 없는 사유는 받지 않는다', () => {
    expect(
      reportFormSchema.safeParse({ reason: 'OTHER', detail: '' }).success,
    ).toBe(false);
  });
});

describe('invalidFields', () => {
  it('INVALID_INPUT의 fieldErrors 중 폼에 있는 칸만 한 번씩 돌려준다', () => {
    const error = new ApiError(400, 'INVALID_INPUT', '잘못된 입력', [
      { field: 'content', reason: '공백일 수 없습니다' },
      { field: 'content', reason: '크기가 0에서 2000 사이여야 합니다' },
      { field: 'request.rating', reason: '1 이상이어야 합니다' },
      { field: 'npayCode', reason: '크기가 0에서 20 사이여야 합니다' },
    ]);

    expect(invalidFields(error, REVIEW_FORM_FIELDS)).toEqual([
      'content',
      'rating',
    ]);
  });

  it('다른 에러 코드나 ApiError가 아니면 빈 배열이다', () => {
    const conflict = new ApiError(409, 'REVIEW_ALREADY_REPORTED', '이미 신고', [
      { field: 'reason', reason: 'x' },
    ]);
    expect(invalidFields(conflict, REPORT_FORM_FIELDS)).toEqual([]);
    expect(invalidFields(new Error('boom'), REPORT_FORM_FIELDS)).toEqual([]);
  });
});
