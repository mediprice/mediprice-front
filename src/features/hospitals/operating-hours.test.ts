import { describe, expect, it } from 'vitest';

import { groupOperatingHours, summarizeOperatingInfo } from './operating-hours';

const day = (d: string, start: string | null, end: string | null) => ({
  day: d,
  start,
  end,
});

describe('groupOperatingHours', () => {
  it('연속된 요일의 시간이 같으면 한 줄로 묶는다', () => {
    const hours = ['MON', 'TUE', 'WED', 'THU', 'FRI'].map((d) =>
      day(d, '09:00', '18:00'),
    );

    expect(
      groupOperatingHours([...hours, day('SAT', '09:00', '13:00')]),
    ).toEqual([
      { from: 'MON', to: 'FRI', start: '09:00', end: '18:00' },
      { from: 'SAT', to: 'SAT', start: '09:00', end: '13:00' },
    ]);
  });

  it('요일 순서가 섞여 있어도 정렬하고, 사이에 빠진 요일이 있으면 묶지 않는다', () => {
    expect(
      groupOperatingHours([
        day('WED', '09:00', '18:00'),
        day('MON', '09:00', '18:00'),
      ]),
    ).toEqual([
      { from: 'MON', to: 'MON', start: '09:00', end: '18:00' },
      { from: 'WED', to: 'WED', start: '09:00', end: '18:00' },
    ]);
  });

  it('시간이 비었거나 형식이 깨진 요일, 모르는 요일은 버린다', () => {
    expect(
      groupOperatingHours([
        day('MON', null, '18:00'),
        day('TUE', '9시', '18:00'),
        day('HOL', '09:00', '13:00'),
      ]),
    ).toEqual([]);
  });
});

describe('summarizeOperatingInfo', () => {
  const info = {
    hours: [day('MON', '09:00', '18:00')],
    lunch: { weekday: '12:30 ~ 13:30', saturday: '  ' },
    reception: { weekday: null, saturday: null },
    closed: { sunday: '휴진', holiday: null },
    parking: { count: '30', feeYn: 'Y', note: '2시간 무료' },
    emergency: { dayYn: 'N', nightYn: 'y' },
  };

  it('운영 정보가 없으면 null이다', () => {
    expect(summarizeOperatingInfo(null)).toBeNull();
  });

  it('빈 문자열은 빼고 Y/N과 주차 대수를 해석한다', () => {
    const summary = summarizeOperatingInfo(info);

    expect(summary?.lunch).toEqual({ weekday: '12:30 ~ 13:30' });
    expect(summary?.closed.sunday).toBe('휴진');
    expect(summary?.parking).toEqual({
      count: 30,
      isPaid: true,
      note: '2시간 무료',
    });
    expect(summary?.emergency).toEqual({ isDay: false, isNight: true });
    expect(summary?.isEmpty).toBe(false);
  });

  it('보여 줄 값이 하나도 없으면 isEmpty다', () => {
    const summary = summarizeOperatingInfo({
      hours: [],
      lunch: { weekday: null, saturday: '' },
      reception: { weekday: null, saturday: null },
      closed: { sunday: null, holiday: null },
      parking: { count: '0', feeYn: null, note: null },
      emergency: { dayYn: null, nightYn: 'N' },
    });

    expect(summary?.isEmpty).toBe(true);
  });
});
