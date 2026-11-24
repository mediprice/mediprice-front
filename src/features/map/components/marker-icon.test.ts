import { describe, expect, it } from 'vitest';

import { markerContentOf } from './marker-icon';

const classesOf = (input: Parameters<typeof markerContentOf>[0]) =>
  markerContentOf(input).className.split(' ');

describe('markerContentOf', () => {
  it('점으로 줄인 마커는 글자 없이 기준점의 점만 그린다', () => {
    const content = markerContentOf({
      kind: 'price',
      label: '45,000원',
      display: 'dot',
    });
    expect(content.label).toBeUndefined();
    expect(content.className).toContain('-translate-1/2');
    expect(content.className).not.toContain('before:content-');
  });

  it.each(['label', 'hover', 'selected'] as const)(
    '%s 상태의 알약은 점 요소 위에 띄워 포인터 아래의 점을 지우지 않는다',
    (display) => {
      const content = markerContentOf({
        kind: 'price',
        label: '45,000원 외 1곳',
        display,
      });
      expect(content.label).toBe('45,000원 외 1곳');
      expect(content.text).toBeUndefined();
      const classes = classesOf({ kind: 'price', label: 'x', display });
      expect(classes).toEqual(
        expect.arrayContaining([
          'size-4',
          '-translate-1/2',
          'bg-primary',
          'before:content-[attr(data-label)]',
        ]),
      );
    },
  );

  it('마우스를 올려도 알약과 점의 위치(클래스 중 위치 관련)는 label 상태와 같다', () => {
    const position = (display: 'label' | 'hover') =>
      classesOf({ kind: 'price', label: 'x', display }).filter((name) =>
        /^(absolute|top-|left-|size-|-translate|before:(absolute|bottom-|left-|-translate|min-h-))/.test(
          name,
        ),
      );
    expect(position('hover')).toEqual(position('label'));
  });

  it('가격 정보 없음은 점선 알약과 회색 점을 쓴다', () => {
    const classes = classesOf({
      kind: 'noPrice',
      label: 'x',
      display: 'label',
    });
    expect(classes).toEqual(
      expect.arrayContaining(['before:border-dashed', 'bg-text-tertiary']),
    );
  });

  it('고른 마커는 더 큰 알약과 고리로 구분한다', () => {
    expect(
      classesOf({ kind: 'price', label: 'x', display: 'selected' }),
    ).toEqual(expect.arrayContaining(['before:min-h-9', 'before:ring-2']));
  });

  it('항목 없는 지도(plain)는 평소 점, 마우스를 올리면 이름 알약이다', () => {
    expect(
      markerContentOf({ kind: 'plain', label: '병원', display: 'label' }).label,
    ).toBeUndefined();
    expect(
      markerContentOf({ kind: 'plain', label: '병원', display: 'hover' }).label,
    ).toBe('병원');
  });

  it('순번 배지는 숫자를 요소 안 글자로 넣고, 고르면 이름 알약이 된다', () => {
    expect(
      markerContentOf({
        kind: 'plain',
        label: '병원',
        badge: '2',
        display: 'hover',
      }),
    ).toMatchObject({ text: '2' });
    expect(
      markerContentOf({
        kind: 'plain',
        label: '병원',
        badge: '2',
        display: 'selected',
      }),
    ).toMatchObject({ label: '병원' });
  });

  it('기준 장소는 늘 알약이고 고를 수 없게 보인다', () => {
    const content = markerContentOf({
      kind: 'place',
      label: '강남역',
      display: 'hover',
    });
    expect(content.label).toBe('강남역');
    expect(content.className.split(' ')).toContain('cursor-default');
    expect(content.className.split(' ')).not.toContain('before:shadow-float');
  });
});
