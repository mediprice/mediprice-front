import type { LiveFeeItem } from './schemas';

export type LiveFeeVerdict = 'same' | 'changed' | 'none';

/** 누리집에 가격이 없으면 changed 값과 관계없이 비교할 수 없는 것으로 본다. */
export function itemVerdict(item: LiveFeeItem): LiveFeeVerdict {
  if (item.webMinPrice == null && item.webMaxPrice == null) return 'none';
  return item.changed ? 'changed' : 'same';
}

/** 하나라도 다르면 다름, 비교할 수 있는 항목이 하나도 없으면 정보 없음이다. */
export function summarizeVerdict(items: LiveFeeItem[]): LiveFeeVerdict {
  const verdicts = items.map(itemVerdict);
  if (verdicts.includes('changed')) return 'changed';
  if (verdicts.includes('same')) return 'same';
  return 'none';
}

/** 공개 월은 "2026-10"·"202610"·"2026-10-01" 모양으로 올 수 있다. 시간대에 밀리지 않게 그 달 15일로 만든다. */
export function parsePublishedMonth(value: string | null) {
  const match = value?.match(/^(\d{4})-?(\d{2})/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return new Date(Date.UTC(year, month - 1, 15));
}
