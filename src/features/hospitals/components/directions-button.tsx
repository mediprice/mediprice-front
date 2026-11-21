'use client';

import { Navigation } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { buildNaverMapUrl, buildNaverRouteScheme } from '../detail-links';

/** 앱이 열리면 페이지가 가려진다. 이 시간 안에 가려지지 않으면 앱이 없다고 보고 웹 지도로 보낸다. */
const APP_OPEN_WAIT_MS = 1500;

const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/**
 * 네이버 지도 길찾기. 휴대폰은 네이버 지도 앱의 대중교통 길찾기를 열고(출발지는 앱의 현재 위치), 앱이 없거나 좌표가 없으면
 * 네이버 지도 웹에서 병원을 찾아 보여 준다(거기서 길찾기). 컴퓨터는 웹 지도를 새 창으로 연다.
 */
export function DirectionsButton({
  name,
  query,
  position,
  className,
}: {
  name: string;
  /** 웹 지도 검색어. 주소가 있으면 주소가 병원 이름보다 정확하다. */
  query: string;
  position: { lat: number; lng: number } | null;
  className?: string;
}) {
  const t = useTranslations('common.directions');
  const webUrl = buildNaverMapUrl(query);

  const open = () => {
    if (!position || !isMobileDevice()) {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    const fallback = window.setTimeout(() => {
      if (document.visibilityState === 'visible') window.location.href = webUrl;
    }, APP_OPEN_WAIT_MS);
    document.addEventListener(
      'visibilitychange',
      () => window.clearTimeout(fallback),
      { once: true },
    );
    window.location.href = buildNaverRouteScheme(
      { ...position, name },
      window.location.origin,
    );
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={open}
      className={cn('relative z-10', className)}
    >
      <Navigation aria-hidden="true" />
      {t('label')}
      <span className="sr-only">{t('description', { name })}</span>
    </Button>
  );
}
