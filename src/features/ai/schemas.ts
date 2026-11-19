import { z } from 'zod';

/** mediprice-ai의 TurnKind(app/pipeline/state.py)와 같은 값이다. */
export const TURN_KINDS = [
  'question',
  'result',
  'no_match',
  'out_of_scope',
  'self_harm',
  'limit',
  'error',
] as const;

export const MAX_INPUT_LENGTH = 1000;
const MAX_RESULT_ITEMS = 3;

export const turnInputSchema = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .max(MAX_INPUT_LENGTH, 'validation.invalid');

/** 대화 상태는 AI 서버의 계약이라 화면은 열어 보지 않고 다음 턴에 그대로 돌려준다. */
export const turnStateSchema = z.record(z.string(), z.unknown());

export const turnQuestionSchema = z.object({
  about: z.string(),
  text: z.string(),
  options: z.array(z.string()),
});

export const turnItemSchema = z.object({
  code: z.string().min(1),
  reason: z.string(),
});

/** 사용자가 말한 장소를 AI 서버가 DB의 시도·시군구로 맞춘 결과. 형식이 다르면 지역 없이 보여 준다. */
export const turnAreaSchema = z.object({
  sidoCode: z.string().regex(/^\d{6}$/),
  sgguCode: z
    .string()
    .regex(/^\d{6}$/)
    .nullish()
    .transform((value) => value ?? null),
  label: z.string().trim().min(1).max(40),
});

export const turnResponseSchema = z.object({
  state: turnStateSchema,
  kind: z.enum(TURN_KINDS),
  reply: z.string(),
  questions: z.array(turnQuestionSchema).default([]),
  items: z
    .array(turnItemSchema)
    .default([])
    .transform((items) => items.slice(0, MAX_RESULT_ITEMS)),
  emergencyBanner: z.boolean().default(false),
  area: turnAreaSchema.nullable().catch(null),
  remainingTurns: z
    .number()
    .int()
    .nonnegative()
    .nullish()
    .transform((value) => value ?? null),
});

export const transcribeResponseSchema = z.object({ text: z.string() });

export type TurnKind = (typeof TURN_KINDS)[number];
export type TurnState = z.infer<typeof turnStateSchema>;
export type TurnQuestion = z.infer<typeof turnQuestionSchema>;
export type TurnItem = z.infer<typeof turnItemSchema>;
export type TurnArea = z.infer<typeof turnAreaSchema>;
export type TurnResponse = z.infer<typeof turnResponseSchema>;
