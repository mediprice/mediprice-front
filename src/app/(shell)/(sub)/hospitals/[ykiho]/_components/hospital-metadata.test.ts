import { describe, expect, it } from 'vitest';

import { buildHospitalMetadata } from './hospital-metadata';

/** 메시지 키와 값을 그대로 보여 주는 가짜 번역 함수. */
const t = ((key: string, values?: Record<string, unknown>) =>
  values ? `${key} ${JSON.stringify(values)}` : key) as never;

const HOSPITAL = {
  ykiho: 'a+b==',
  name: '프라임병원',
  className: '병원',
  sidoName: '부산',
  sgguName: '부산남구',
  emdongName: '대연동',
  postNo: null,
  address: null,
  phone: null,
  homepage: null,
  latitude: null,
  longitude: null,
  doctorCount: null,
  openedDate: null,
  operatingInfo: null,
};

describe('buildHospitalMetadata', () => {
  it('병원 이름과 정리한 시도·시군구를 제목·설명에 넣는다', () => {
    const metadata = buildHospitalMetadata({
      ykiho: 'a+b==',
      hospital: HOSPITAL,
      t,
    });

    expect(metadata.title).toBe(
      'metadata.titleWithLocation {"name":"프라임병원","location":"부산 남구"}',
    );
    expect(metadata.description).toBe(
      'metadata.descriptionWithLocation {"name":"프라임병원","location":"부산 남구"}',
    );
  });

  it('지역이 없으면 이름만 쓴다', () => {
    const metadata = buildHospitalMetadata({
      ykiho: 'a+b==',
      hospital: { ...HOSPITAL, sidoName: null, sgguName: null },
      t,
    });

    expect(metadata.title).toBe('metadata.title {"name":"프라임병원"}');
    expect(metadata.description).toBe(
      'metadata.description {"name":"프라임병원"}',
    );
  });

  it('canonical은 항목 파라미터 없는 병원 주소이고 ykiho를 인코딩한다', () => {
    expect(
      buildHospitalMetadata({ ykiho: 'a+b==', hospital: HOSPITAL, t })
        .alternates,
    ).toEqual({ canonical: '/hospitals/a%2Bb%3D%3D' });
  });

  it('병원을 읽지 못했으면 공통 제목이다', () => {
    expect(buildHospitalMetadata({ ykiho: 'H1', hospital: null, t })).toEqual({
      title: 'metaTitle',
      alternates: { canonical: '/hospitals/H1' },
    });
  });
});
