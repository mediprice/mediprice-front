// shadcn 컴포넌트를 components/primitives에 추가한다. 실행: pnpm ui:add dialog sheet
// 레지스트리 생성물은 `cn` 패키지를 import하는데, 그 cn은 우리 토큰(text-title 등)을 몰라 클래스를 잘못 지운다.
// 그래서 생성 직후 import를 @/lib/utils로 바꾸고 `cn` 의존성을 뺀다.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const components = process.argv.slice(2);
if (components.length === 0) {
  console.error('추가할 컴포넌트 이름을 넘겨 주세요. 예: pnpm ui:add dialog');
  process.exit(1);
}

const run = (...args) => execFileSync('pnpm', args, { stdio: 'inherit' });
const dir = 'src/components/primitives';

run('exec', 'shadcn', 'add', ...components);

for (const file of readdirSync(dir)) {
  const path = join(dir, file);
  const source = readFileSync(path, 'utf8');
  const patched = source.replace(/from ["']cn["']/g, "from '@/lib/utils'");
  if (patched !== source) writeFileSync(path, patched);
}

const { dependencies = {} } = JSON.parse(readFileSync('package.json', 'utf8'));
if ('cn' in dependencies) run('remove', 'cn');

run('exec', 'prettier', '--write', dir);
run('exec', 'eslint', '--fix', dir);
