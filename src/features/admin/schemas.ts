import { z } from 'zod';

import { CLAIM_ACTIONS, CLAIM_NOTE_MAX } from './claim-api';

export const claimResolveSchema = z.object({
  action: z.enum(CLAIM_ACTIONS, 'actionRequired'),
  note: z
    .string()
    .trim()
    .min(1, 'noteRequired')
    .max(CLAIM_NOTE_MAX, 'noteTooLong'),
  claimantNotified: z.boolean(),
  authorNotified: z.boolean(),
});

export type ClaimResolveInput = z.input<typeof claimResolveSchema>;
export type ClaimResolveForm = z.output<typeof claimResolveSchema>;

const RESOLVE_ERROR_KEYS = [
  'actionRequired',
  'noteRequired',
  'noteTooLong',
] as const;

export function claimResolveErrorKey(message: string | undefined) {
  return RESOLVE_ERROR_KEYS.find((key) => key === message) ?? 'invalid';
}
