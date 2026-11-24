import { describe, expect, it } from 'vitest';

import {
  LEGAL_DOCUMENT_VERSIONS,
  LEGAL_FACTS,
  type LegalDocumentKey,
} from './legal';

function nullPaths(value: unknown, path: string): string[] {
  if (value === null) return [path];
  if (Array.isArray(value)) {
    return value.flatMap((item: unknown, index) => {
      const label =
        typeof item === 'object' && item !== null && 'task' in item
          ? String(item.task)
          : index;
      return nullPaths(item, `${path}[${label}]`);
    });
  }
  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      nullPaths(item, path ? `${path}.${key}` : key),
    );
  }
  return [];
}

/** 출시 전에만 `pnpm launch:check`(LAUNCH_CHECK=1)로 돌린다. 평소 테스트에서는 건너뛴다. */
describe.skipIf(process.env.LAUNCH_CHECK !== '1')(
  '출시 전 법적 고지 설정',
  () => {
    it('운영자가 확정할 값이 모두 채워져 있다', () => {
      expect(nullPaths(LEGAL_FACTS, '')).toEqual([]);
    });

    it('위치 약관의 운영자 값(신고번호, 이용 기록 보관 기간, 시행일)이 설정 대상에 있다', () => {
      expect(LEGAL_FACTS).toHaveProperty('locationService.reportNumber');
      expect(LEGAL_FACTS.retention).toHaveProperty('locationUsageDays');
      expect(LEGAL_FACTS.effectiveDates).toHaveProperty('LOCATION');
    });

    it('위탁·국외 이전 업체가 한 곳 이상 있다', () => {
      expect(LEGAL_FACTS.processors.length).toBeGreaterThan(0);
    });

    it('시행일이 문서 버전 날짜보다 앞서지 않는다', () => {
      const keys: LegalDocumentKey[] = [
        'TERMS',
        'PRIVACY',
        'LOCATION',
        'REVIEW_POLICY',
      ];
      for (const key of keys) {
        const effectiveDate = LEGAL_FACTS.effectiveDates[key] ?? '';
        expect(effectiveDate >= LEGAL_DOCUMENT_VERSIONS[key], key).toBe(true);
      }
    });
  },
);
