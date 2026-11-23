'use client';

import { useQuery } from '@tanstack/react-query';

import { isLocationConsentActive } from '@/features/auth/consent-status';
import { consentQueries } from '@/features/auth/queries';
import { useSession } from '@/features/auth/use-session';
import {
  type LocationAccess,
  locationAccess,
} from '@/features/map/location-access';

/**
 * 로그인·위치 동의 상태로 현재 위치를 쓸 수 있는지. 세션이나 동의 현황을 아직 모르면 null이다.
 * 철회 뒤 무효화된(오래된) 동의 현황을 다시 받는 중이면 옛 값으로 위치를 읽지 않게 null로 본다.
 */
export function useLocationAccess(): LocationAccess | null {
  const { status } = useSession();
  const isSignedIn = status === 'authenticated';
  const consent = useQuery({
    ...consentQueries.status(),
    enabled: isSignedIn,
  });
  if (status === 'pending') return null;
  if (!isSignedIn) return 'signedOut';
  if (consent.isPending || (consent.isFetching && consent.isStale)) return null;
  return locationAccess({
    isSignedIn,
    isConsentActive: isLocationConsentActive(consent.data),
  });
}
