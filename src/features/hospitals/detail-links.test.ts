import { describe, expect, it } from 'vitest';

import {
  buildNaverMapUrl,
  decodeYkiho,
  parseItemParam,
  toHomepageUrl,
  toTelHref,
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
