import { z } from 'zod';

import facts from './legal-facts.json';

/** 동의 기록에 남기는 문서 버전. 백엔드가 같은 키를 쓰므로(app.consent.versions) 문서를 고치면 양쪽을 함께 올린다. AGE_14는 "만 N세 이상" 확인 문구의 버전이다. */
export const LEGAL_DOCUMENT_VERSIONS = {
  TERMS: '2026-11-19',
  PRIVACY: '2026-11-23',
  LOCATION: '2026-11-23',
  AGE_14: '2026-11-19',
  REVIEW_POLICY: '2026-11-19',
  MEDICAL_PROFILE: '2026-11-19',
} as const;

/** 권리침해 신고 화면의 개인정보 수집·이용 안내문 버전. 백엔드 CLAIMS_PRIVACY_NOTICE_VERSION과 같아야 접수를 받는다. 안내문(reviews.claim.notice)을 고치면 양쪽을 함께 올린다. */
export const CLAIM_PRIVACY_NOTICE_VERSION = '2026-11-19';

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
    LOCATION: date,
    REVIEW_POLICY: date,
  }),
  locationService: z.object({ reportNumber: text.nullable() }),
  minimumAge: z.number().int().min(14).nullable(),
  retention: z.object({
    accessLogMonths: count,
    backupDays: count,
    reviewOnWithdrawal: z.enum(['anonymize', 'delete']).nullable(),
    /** 처리를 마친 권리침해 신고(신청인 이름·이메일 포함)를 지우기까지의 일수. 백엔드 RETENTION_REVIEW_CLAIM_DAYS와 같은 값이다. */
    rightsClaimDays: count,
    /** 위치 이용 기록(좌표 없음)을 지우기까지의 일수. 백엔드 RETENTION_LOCATION_USAGE_DAYS와 같은 값이다. */
    locationUsageDays: z.number().int().positive().nullable(),
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
