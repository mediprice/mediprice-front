// 백엔드 OpenAPI 스펙(/api-docs)에서 타입을 생성한다. 실행: pnpm api:generate
import { writeFile } from 'node:fs/promises';

import openapiTS, { astToString } from 'openapi-typescript';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) {
  console.error('NEXT_PUBLIC_API_URL이 설정되어 있지 않습니다. (.env 확인)');
  process.exit(1);
}

const specUrl = new URL('/api-docs', apiUrl);
const ast = await openapiTS(specUrl);
const banner =
  '/* eslint-disable */\n// 자동 생성 파일입니다. 직접 수정하지 말고 `pnpm api:generate`로 갱신하세요.\n';
await writeFile('src/lib/api/schema.d.ts', banner + astToString(ast));
console.log(`생성 완료: ${specUrl.href} → src/lib/api/schema.d.ts`);
