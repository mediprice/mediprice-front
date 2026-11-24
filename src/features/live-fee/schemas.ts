import { z } from 'zod/mini';

const price = z.nullable(z.number());

const liveFeeItemSchema = z.object({
  code: z.string(),
  name: z.string(),
  dbMinPrice: price,
  dbMaxPrice: price,
  webMinPrice: price,
  webMaxPrice: price,
  webPublishedMonth: z.nullable(z.string()),
  changed: z.boolean(),
});

export const liveFeeResponseSchema = z.object({
  ykiho: z.string(),
  yoyangCode: z.string(),
  source: z.string(),
  fetchedAt: z.iso.datetime({ offset: true }),
  items: z.array(liveFeeItemSchema),
});

export type LiveFeeItem = z.infer<typeof liveFeeItemSchema>;
export type LiveFeeResponse = z.infer<typeof liveFeeResponseSchema>;
