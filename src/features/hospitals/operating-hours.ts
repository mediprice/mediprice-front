import type { components } from '@/lib/api/schema';

type OperatingInfo = components['schemas']['OperatingInfo'];
type DayHours = components['schemas']['DayHours'];

const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
type WeekDay = (typeof WEEK_DAYS)[number];

export type HoursGroup = {
  from: WeekDay;
  to: WeekDay;
  start: string;
  end: string;
};

const TIME = /^([01]\d|2[0-4]):[0-5]\d$/;

function isWeekDay(day: string): day is WeekDay {
  return (WEEK_DAYS as readonly string[]).includes(day);
}

function isValidHours(
  hours: DayHours,
): hours is DayHours & { day: WeekDay; start: string; end: string } {
  return (
    isWeekDay(hours.day) &&
    hours.start != null &&
    hours.end != null &&
    TIME.test(hours.start) &&
    TIME.test(hours.end)
  );
}

/** 요일순으로 정렬하고 연속된 요일의 시간이 같으면 "월–금"처럼 한 줄로 묶는다. 형식이 깨진 값은 버린다. */
export function groupOperatingHours(hours: readonly DayHours[]): HoursGroup[] {
  const valid = hours
    .filter(isValidHours)
    .sort((a, b) => WEEK_DAYS.indexOf(a.day) - WEEK_DAYS.indexOf(b.day));

  const groups: HoursGroup[] = [];
  for (const day of valid) {
    const last = groups.at(-1);
    const isNextDay =
      last != null &&
      WEEK_DAYS.indexOf(day.day) === WEEK_DAYS.indexOf(last.to) + 1;
    if (last && isNextDay && last.start === day.start && last.end === day.end) {
      last.to = day.day;
    } else {
      groups.push({
        from: day.day,
        to: day.day,
        start: day.start,
        end: day.end,
      });
    }
  }
  return groups;
}

function hasText(value: string | null | undefined): value is string {
  return value != null && value.trim() !== '';
}

export type OperatingSummary = {
  hours: HoursGroup[];
  lunch: { weekday?: string; saturday?: string };
  reception: { weekday?: string; saturday?: string };
  closed: { sunday?: string; holiday?: string };
  parking: { count?: number; isPaid?: boolean; note?: string };
  emergency: { isDay: boolean; isNight: boolean };
  isEmpty: boolean;
};

function text(value: string | null | undefined) {
  return hasText(value) ? value.trim() : undefined;
}

function yes(value: string | null | undefined) {
  return value?.trim().toUpperCase() === 'Y';
}

function parseCount(value: string | null | undefined) {
  if (!hasText(value)) return undefined;
  const count = Number(value.trim());
  return Number.isInteger(count) && count > 0 ? count : undefined;
}

/** 심평원 운영 정보는 자유 형식 문자열이라 보여 줄 수 있는 값만 골라 낸다. 모두 비면 isEmpty다. */
export function summarizeOperatingInfo(
  info: OperatingInfo | null | undefined,
): OperatingSummary | null {
  if (!info) return null;
  const parkingFee = info.parking?.feeYn?.trim().toUpperCase();
  const summary: OperatingSummary = {
    hours: groupOperatingHours(info.hours ?? []),
    lunch: {
      weekday: text(info.lunch?.weekday),
      saturday: text(info.lunch?.saturday),
    },
    reception: {
      weekday: text(info.reception?.weekday),
      saturday: text(info.reception?.saturday),
    },
    closed: {
      sunday: text(info.closed?.sunday),
      holiday: text(info.closed?.holiday),
    },
    parking: {
      count: parseCount(info.parking?.count),
      isPaid:
        parkingFee === 'Y' ? true : parkingFee === 'N' ? false : undefined,
      note: text(info.parking?.note),
    },
    emergency: {
      isDay: yes(info.emergency?.dayYn),
      isNight: yes(info.emergency?.nightYn),
    },
    isEmpty: false,
  };
  summary.isEmpty =
    summary.hours.length === 0 &&
    [
      summary.lunch.weekday,
      summary.lunch.saturday,
      summary.reception.weekday,
      summary.reception.saturday,
      summary.closed.sunday,
      summary.closed.holiday,
    ].every((value) => value === undefined) &&
    summary.parking.count === undefined &&
    summary.parking.isPaid === undefined &&
    summary.parking.note === undefined &&
    !summary.emergency.isDay &&
    !summary.emergency.isNight;
  return summary;
}
