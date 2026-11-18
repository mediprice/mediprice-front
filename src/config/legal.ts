import { z } from 'zod';

import facts from './legal-facts.json';

/** 동의 기록에 남기는 문서 버전. 백엔드가 같은 키를 쓰므로(app.consent.versions) 문서를 고치면 양쪽을 함께 올린다. AGE_14는 "만 N세 이상" 확인 문구의 버전이다. */
export const LEGAL_DOCUMENT_VERSIONS = {
  TERMS: '2026-11-19',
  PRIVACY: '2026-11-19',
  AGE_14: '2026-11-19',
  REVIEW_POLICY: '2026-11-19',
  MEDICAL_PROFILE: '2026-11-19',
} as const;

const COUNTRY_CODES = [
  'KR',
  'US',
  'JP',
  'SG',
  'HK',
  'TW',
  'IN',
  'AU',
  'CA',
  'GB',
  'IE',
  'DE',
  'FR',
  'NL',
  'BE',
  'FI',
] as const;

const PROCESSOR_TASKS = [
  'database',
  'webHosting',
  'apiHosting',
  'llmGateway',
  'llmModel',
] as const;

const text = z.string().trim().min(1);
/** false는 "해당 없음"(표시하지 않음), null은 아직 정하지 않은 값이다. */
const optionalText = z.union([text, z.literal(false)]).nullable();
const date = z.iso.date().nullable();
const count = z.number().int().min(0).nullable();

const legalFactsSchema = z.object({
  operator: z.object({
    name: text.nullable(),
    representative: optionalText,
    businessRegistrationNumber: optionalText,
    address: text.nullable(),
    email: z.email().nullable(),
    phone: optionalText,
  }),
  privacyOfficer: z.object({
    name: text.nullable(),
    position: optionalText,
    email: z.email().nullable(),
    phone: optionalText,
  }),
  effectiveDates: z.object({
    TERMS: date,
    PRIVACY: date,
    REVIEW_POLICY: date,
  }),
  minimumAge: z.number().int().min(14).nullable(),
  retention: z.object({
    accessLogMonths: count,
    backupDays: count,
    reviewOnWithdrawal: z.enum(['anonymize', 'delete']).nullable(),
  }),
  ai: z.object({
    providerTrainingUse: z.boolean().nullable(),
    medicalProfileSentToProvider: z.boolean().nullable(),
  }),
  security: z.object({ internalPlanAdopted: z.boolean().nullable() }),
  processors: z.array(
    z.object({
      task: z.enum(PROCESSOR_TASKS),
      company: text.nullable(),
      contact: text.nullable(),
      countries: z.array(z.enum(COUNTRY_CODES)).min(1).nullable(),
      retention: text.nullable(),
    }),
  ),
  thirdParties: z.array(
    z.object({ recipient: text, purpose: text, items: text, retention: text }),
  ),
});

/** 운영자가 확정할 사실 값(legal-facts.json). null은 화면에 "운영자 확정 필요"로 보이고 `pnpm launch:check`를 실패시킨다. */
export const LEGAL_FACTS = legalFactsSchema.parse(facts);

export type LegalDocumentKey = keyof (typeof LEGAL_FACTS)['effectiveDates'];
