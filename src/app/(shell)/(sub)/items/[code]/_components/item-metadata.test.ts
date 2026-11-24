import { describe, expect, it } from 'vitest';

import { buildItemMetadata } from './item-metadata';

/** 메시지 키와 값을 그대로 보여 주는 가짜 번역 함수. */
const t = ((key: string, values?: Record<string, unknown>) =>
  values ? `${key} ${JSON.stringify(values)}` : key) as never;

const ITEM = {
  code: 'MX1220000',
  name: '이학요법료/도수치료',
  mdivCode: '1070Z',
  mdivName: '이학요법료',
  sdivCode: '1070Z050',
  sdivName: '도수치료',
  detailCode: '1070Z050',
  detailName: '도수치료',
  description: null,
  startDate: null,
  endDate: null,
};

const SUMMARY = {
  npayCode: 'MX1220000',
  minPrice: 1000,
  maxPrice: 500000,
  avgPrice: 126426,
  priceCount: 1158,
  hospitalCount: 327,
};

describe('buildItemMetadata', () => {
  it('대분류를 뗀 항목 이름을 제목에, 서울·경기 평균과 병원 수를 설명에 넣는다', () => {
    const metadata = buildItemMetadata({
      siteName: 'Mediprice',
      code: 'MX1220000',
      item: ITEM,
      summary: SUMMARY,
      regionLabel: '서울·경기',
      t,
    });

    expect(metadata.title).toBe('title {"name":"도수치료"}');
    expect(metadata.description).toBe(
      'descriptionWithAverage {"name":"도수치료","region":"서울·경기","average":126426,"hospitals":327}',
    );
    expect(metadata.alternates).toEqual({ canonical: '/items/MX1220000' });
  });

  it.each([
    ['공개 가격이 없으면', { ...SUMMARY, avgPrice: null, priceCount: 0 }],
    ['요약을 읽지 못했으면', null],
  ])('%s 평균 없는 설명을 쓴다', (_name, summary) => {
    const metadata = buildItemMetadata({
      siteName: 'Mediprice',
      code: 'MX1220000',
      item: ITEM,
      summary,
      regionLabel: '서울·경기',
      t,
    });

    expect(metadata.description).toBe(
      'descriptionWithoutAverage {"name":"도수치료"}',
    );
  });

  it('항목을 읽지 못했으면 공통 제목·설명이고 canonical은 그대로다', () => {
    const metadata = buildItemMetadata({
      siteName: 'Mediprice',
      code: 'A B',
      item: null,
      summary: null,
      regionLabel: '서울·경기',
      t,
    });

    expect(metadata).toEqual({
      title: 'fallbackTitle',
      description: 'fallbackDescription',
      alternates: { canonical: '/items/A%20B' },
      openGraph: {
        type: 'website',
        siteName: 'Mediprice',
        locale: 'ko_KR',
        url: '/items/A%20B',
      },
    });
  });
});
