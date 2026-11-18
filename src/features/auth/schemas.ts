import { z } from 'zod';

/** 백엔드 UpdateMeRequest와 같은 규칙(공백 아님, 50자 이하). 메시지는 mypage.nickname.errors의 키다. */
export const nicknameSchema = z.object({
  name: z.string().trim().min(1, 'required').max(50, 'tooLong'),
});

export type NicknameForm = z.infer<typeof nicknameSchema>;

export type NicknameErrorKey = 'required' | 'tooLong' | 'invalid';

export function nicknameErrorKey(
  message: string | undefined,
): NicknameErrorKey {
  return message === 'required' || message === 'tooLong' ? message : 'invalid';
}
