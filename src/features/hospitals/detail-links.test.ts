import { describe, expect, it } from 'vitest';

import {
  buildNaverMapUrl,
  buildNaverRouteScheme,
  decodeYkiho,
  parseBackParam,
  parseItemParam,
  parseVariantParam,
  toHomepageUrl,
  toTelHref,
  variantQuery,
} from './detail-links';

describe('parseItemParam', () => {
  it('영숫자 비급여 코드만 받는다', () => {
    expect(parseItemParam('MX1220000')).toBe('MX1220000');
    expect(parseItemParam(['MX1220000'])).toBeNull();
    expect(parseItemParam('../admin')).toBeNull();
    expect(parseItemParam(undefined)).toBeNull();
  });
});

describe('decodeYkiho', () => {
  it('인코딩된 값은 풀고, 이미 풀린 값과 깨진 값은 그대로 둔다', () => {
    expect(decodeYkiho('a%2Bb%3D')).toBe('a+b=');
    expect(decodeYkiho('a+b=')).toBe('a+b=');
    expect(decodeYkiho('%E0%A4%A')).toBe('%E0%A4%A');
  });
});

describe('buildNaverMapUrl', () => {
  it('주소를 경로에 인코딩해 네이버 지도 검색 주소를 만든다', () => {
    expect(buildNaverMapUrl('서울 중랑구 공릉로 76')).toBe(
      'https://map.naver.com/p/search/%EC%84%9C%EC%9A%B8%20%EC%A4%91%EB%9E%91%EA%B5%AC%20%EA%B3%B5%EB%A6%89%EB%A1%9C%2076',
    );
  });
});

describe('toHomepageUrl', () => {
  it('scheme이 없으면 http를 붙이고 www를 뺀 호스트를 라벨로 쓴다', () => {
    expect(toHomepageUrl(' www.example.co.kr ')).toEqual({
      href: 'http://www.example.co.kr/',
      label: 'example.co.kr',
    });
  });

  it('http(s)가 아니거나 호스트가 이상하면 링크를 만들지 않는다', () => {
    expect(toHomepageUrl('javascript:alert(1)')).toBeNull();
    expect(toHomepageUrl('없음')).toBeNull();
    expect(toHomepageUrl(null)).toBeNull();
  });
});

describe('toTelHref', () => {
  it('숫자만 남겨 tel: 링크를 만들고, 너무 짧으면 만들지 않는다', () => {
    expect(toTelHref('02-975-7500')).toBe('tel:029757500');
    expect(toTelHref('1800-3114')).toBe('tel:18003114');
    expect(toTelHref('-')).toBeNull();
  });
});

describe('parseBackParam', () => {
  it('허용한 검색 조건만 있으면 쿼리 문자열로 돌려준다', () => {
    expect(parseBackParam('region=110000&sggu=110023&sort=price')).toBe(
      'region=110000&sggu=110023&sort=price',
    );
  });

  it('모르는 키, 이상한 값, 중복 키, 빈 값이면 쓰지 않는다', () => {
    expect(parseBackParam('region=110000&next=/admin')).toBeNull();
    expect(parseBackParam('region=<script>')).toBeNull();
    expect(parseBackParam('sort=a&sort=b')).toBeNull();
    expect(parseBackParam('region=')).toBeNull();
    expect(parseBackParam('')).toBeNull();
    expect(parseBackParam(['region=1'])).toBeNull();
  });
});

describe('parseVariantParam', () => {
  it('세부 항목 이름과 가격을 받고, 가격이 없거나 이상하면 이름만 쓴다', () => {
    expect(parseVariantParam(' 도수치료F ', '500000')).toEqual({
      name: '도수치료F',
      price: 500_000,
    });
    expect(parseVariantParam('도수치료F', undefined)).toEqual({
      name: '도수치료F',
      price: null,
    });
    expect(parseVariantParam('도수치료F', '5만')).toEqual({
      name: '도수치료F',
      price: null,
    });
  });

  it('이름이 비었거나 너무 길거나 배열이면 고르지 않은 것으로 본다', () => {
    expect(parseVariantParam('', '1000')).toBeNull();
    expect(parseVariantParam('가'.repeat(121), '1000')).toBeNull();
    expect(parseVariantParam(['a', 'b'], '1000')).toBeNull();
  });

  it('variantQuery로 만든 값을 그대로 되읽는다', () => {
    const query = variantQuery({ name: '도수치료 [1일당]-N', price: 1000 });
    expect(parseVariantParam(query.variant, query.price)).toEqual({
      name: '도수치료 [1일당]-N',
      price: 1000,
    });
  });
});

describe('buildNaverRouteScheme', () => {
  it('도착지 좌표·이름과 앱 이름만 담고 출발지는 비운다', () => {
    const url = buildNaverRouteScheme(
      { lat: 37.59869, lng: 126.91484, name: '리드힐병원 & 의원' },
      'https://mediprice.example',
    );
    expect(url.startsWith('nmap://route/public?')).toBe(true);
    const params = new URLSearchParams(url.split('?')[1]);
    expect(Object.fromEntries(params)).toEqual({
      dlat: '37.59869',
      dlng: '126.91484',
      dname: '리드힐병원 & 의원',
      appname: 'https://mediprice.example',
    });
  });
});
