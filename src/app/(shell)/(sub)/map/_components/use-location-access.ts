'use client';

import { useQuery } from '@tanstack/react-query';

import { isLocationConsentActive } from '@/features/auth/consent-status';
import { useSession } from '@/features/auth/use-session';
import {
  type LocationAccess,
  resolveLocationAccess,
} from '@/features/map/location-access';
import { mapQueries } from '@/features/map/queries';

/** 로그인·위치 동의 상태로 현재 위치를 쓸 수 있는지. 판단 규칙은 resolveLocationAccess를 따른다. */
export function useLocationAccess(): LocationAccess | null {
  const { status } = useSession();
  const consent = useQuery(
    mapQueries.locationConsent(status === 'authenticated'),
  );
  return resolveLocationAccess({
    session: status,
    consent: {
      isPending: consent.isPending,
      isFetching: consent.isFetching,
      isStale: consent.isStale,
      isError: consent.isError,
      isConsentActive: isLocationConsentActive(consent.data),
    },
  });
}
