import { z } from 'zod';

import { ApiError } from '@/lib/api/errors';
import { BFF_BASE } from '@/lib/api/paths';
import { emitSessionExpired } from '@/lib/api/session-events';
import { createUntypedRequest } from '@/lib/api/untyped-request';

/** 백엔드 feature/privacy-consent의 MyDataExportResponse. 파일로 그대로 내려주므로 객체인지만 확인한다. 배포 후 생성 클라이언트로 바꾼다. */
const myDataSchema = z.record(z.string(), z.unknown());

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function createMyDataApi(
  request = createUntypedRequest({
    baseUrl: BFF_BASE,
    onSessionExpired: emitSessionExpired,
  }),
) {
  return {
    fetchExport: () => request.json('/api/users/me/export', myDataSchema),
  };
}

/** 브라우저 전용이다(상대 경로 `/bff`를 쓴다). */
export const myDataApi = createMyDataApi();

/** 파일 이름의 날짜는 한국 날짜다(서머타임이 없어 +9시간이면 된다). */
export function myDataFileName(now: Date) {
  const day = new Date(now.getTime() + KST_OFFSET_MS)
    .toISOString()
    .slice(0, 10)
    .replaceAll('-', '');
  return `mediprice-my-data-${day}.json`;
}

/** 내려받기 경로가 아직 없는 백엔드(배포 전). */
export function isExportUnsupported(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.status === 405 ||
      (error.status === 404 &&
        (error.code === 'RESOURCE_NOT_FOUND' || error.code === 'NOT_FOUND')))
  );
}

/** 받은 JSON을 파일로 저장하게 한다. 브라우저 전용이다. */
export function saveJsonFile(data: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
