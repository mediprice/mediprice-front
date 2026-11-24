import { describe, expect, it } from 'vitest';

import { claimResolveErrorKey, claimResolveSchema } from './schemas';

describe('claimResolveSchema', () => {
  it('처리 방법과 사유가 있어야 한다', () => {
    const result = claimResolveSchema.safeParse({
      note: '   ',
      claimantNotified: false,
      authorNotified: false,
    });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'actionRequired',
      'noteRequired',
    ]);
  });

  it('사유는 앞뒤 공백을 지우고 1,000자까지 받는다', () => {
    expect(
      claimResolveSchema.parse({
        action: 'KEEP_HIDDEN',
        note: ' 사실 확인 중 ',
        claimantNotified: true,
        authorNotified: false,
      }).note,
    ).toBe('사실 확인 중');
    expect(
      claimResolveSchema.safeParse({
        action: 'RESTORE',
        note: '가'.repeat(1001),
        claimantNotified: false,
        authorNotified: false,
      }).error?.issues[0]?.message,
    ).toBe('noteTooLong');
  });

  it('모르는 메시지는 invalid 키다', () => {
    expect(claimResolveErrorKey('noteRequired')).toBe('noteRequired');
    expect(claimResolveErrorKey('Required')).toBe('invalid');
  });
});
