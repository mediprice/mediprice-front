import type { ConsentStatus } from './consent-api';

/** 현재 버전의 위치 동의가 유효한가. 철회했거나 버전이 바뀌어 재동의가 필요하면 false다. */
export function isLocationConsentActive(
  status: ConsentStatus | undefined,
): boolean {
  const location = status?.consents.find(({ type }) => type === 'LOCATION');
  return Boolean(location?.agreed && !location.reconsentRequired);
}

/** 위치 동의만 철회한 것으로 바꾼 동의 현황. 다시 받기 전이나 받기에 실패해도 옛 동의로 위치를 읽지 않게 바로 쓴다. */
export function withLocationWithdrawn(status: ConsentStatus): ConsentStatus {
  return {
    ...status,
    consents: status.consents.map((consent) =>
      consent.type === 'LOCATION' ? { ...consent, agreed: false } : consent,
    ),
  };
}
