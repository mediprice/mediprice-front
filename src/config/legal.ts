import { z } from 'zod/mini';

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

const text = z.string().check(z.trim(), z.minLength(1));
/** false는 "해당 없음"(표시하지 않음), null은 아직 정하지 않은 값이다. */
const optionalText = z.nullable(z.union([text, z.literal(false)]));
const date = z.nullable(z.iso.date());
const count = z.nullable(z.int().check(z.minimum(0)));

const legalFactsSchema = z.object({
  operator: z.object({
    name: z.nullable(text),
    representative: optionalText,
    businessRegistrationNumber: optionalText,
    address: z.nullable(text),
    email: z.nullable(z.email()),
    phone: optionalText,
  }),
  privacyOfficer: z.object({
    name: z.nullable(text),
    position: optionalText,
    email: z.nullable(z.email()),
    phone: optionalText,
  }),
  effectiveDates: z.object({
    TERMS: date,
    PRIVACY: date,
    LOCATION: date,
    REVIEW_POLICY: date,
  }),
  locationService: z.object({ reportNumber: z.nullable(text) }),
  minimumAge: z.nullable(z.int().check(z.minimum(14))),
  retention: z.object({
    accessLogMonths: count,
    backupDays: count,
    reviewOnWithdrawal: z.nullable(z.enum(['anonymize', 'delete'])),
    /** 처리를 마친 권리침해 신고(신청인 이름·이메일 포함)를 지우기까지의 일수. 백엔드 RETENTION_REVIEW_CLAIM_DAYS와 같은 값이다. */
    rightsClaimDays: count,
    /** 위치 이용 기록(좌표 없음)을 지우기까지의 일수. 백엔드 RETENTION_LOCATION_USAGE_DAYS와 같은 값이다. */
    locationUsageDays: z.nullable(z.int().check(z.positive())),
  }),
  ai: z.object({
    providerTrainingUse: z.nullable(z.boolean()),
    medicalProfileSentToProvider: z.nullable(z.boolean()),
  }),
  security: z.object({ internalPlanAdopted: z.nullable(z.boolean()) }),
  processors: z.array(
    z.object({
      task: z.enum(PROCESSOR_TASKS),
      company: z.nullable(text),
      contact: z.nullable(text),
      countries: z.nullable(
        z.array(z.enum(COUNTRY_CODES)).check(z.minLength(1)),
      ),
      retention: z.nullable(text),
    }),
  ),
  thirdParties: z.array(
    z.object({ recipient: text, purpose: text, items: text, retention: text }),
  ),
});

/** 운영자가 확정할 사실 값(legal-facts.json). null은 화면에 "운영자 확정 필요"로 보이고 `pnpm launch:check`를 실패시킨다. */
export const LEGAL_FACTS = legalFactsSchema.parse(facts);

export type LegalDocumentKey = keyof (typeof LEGAL_FACTS)['effectiveDates'];
