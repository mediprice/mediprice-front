import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe('cn', () => {
  it('타이포 토큰과 글자색 토큰을 함께 남긴다', () => {
    expect(cn('text-title', 'text-text-primary')).toBe(
      'text-title text-text-primary',
    );
  });

  it('같은 종류의 타이포 토큰은 뒤의 것만 남긴다', () => {
    expect(cn('text-body', 'text-caption')).toBe('text-caption');
  });

  it('같은 종류의 글자색 토큰은 뒤의 것만 남긴다', () => {
    expect(cn('text-text-primary', 'text-primary-text')).toBe(
      'text-primary-text',
    );
  });

  it('그림자 토큰과 그림자 색을 구분한다', () => {
    expect(cn('shadow-card', 'shadow-float')).toBe('shadow-float');
  });

  it('레이아웃 간격 토큰을 높이로 인식한다', () => {
    expect(cn('h-12', 'h-top-bar')).toBe('h-top-bar');
  });

  it('페이지 너비 토큰을 최대 너비로 인식한다', () => {
    expect(cn('max-w-xl', 'max-w-page')).toBe('max-w-page');
  });

  it('움직임 곡선 토큰은 뒤의 것만 남긴다', () => {
    expect(cn('ease-standard', 'ease-enter')).toBe('ease-enter');
  });

  it('safe-area 여백 유틸을 같은 축의 padding으로 인식한다', () => {
    expect(cn('pb-safe', 'pb-4')).toBe('pb-4');
    expect(cn('pt-4', 'pt-safe')).toBe('pt-safe');
    expect(cn('pr-2 pl-2', 'px-safe')).toBe('px-safe');
    expect(cn('pl-1', 'pl-safe-1')).toBe('pl-safe-1');
    expect(cn('pr-safe-2', 'pr-4')).toBe('pr-4');
  });
});
