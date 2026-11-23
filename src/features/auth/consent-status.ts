import type { ConsentStatus } from './consent-api';

/** 현재 버전의 위치 동의가 유효한가. 철회했거나 버전이 바뀌어 재동의가 필요하면 false다. */
export function isLocationConsentActive(
  status: ConsentStatus | undefined,
): boolean {
  const location = status?.consents.find(({ type }) => type === 'LOCATION');
  return Boolean(location?.agreed && !location.reconsentRequired);
}
