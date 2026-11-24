import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

export const SRC = path.resolve(__dirname, '..');
export const APP = path.join(SRC, 'app');

const ENTRY_NAMES = new Set([
  'page.tsx',
  'layout.tsx',
  'error.tsx',
  'not-found.tsx',
  'loading.tsx',
  'template.tsx',
  'default.tsx',
  'global-error.tsx',
]);

type ImportEdge = { specifier: string; file: string | null; isLazy: boolean };
type SourceInfo = {
  source: ts.SourceFile;
  isClient: boolean;
  imports: ImportEdge[];
};

const sources = new Map<string, SourceInfo>();

function resolveImport(from: string, specifier: string) {
  let base: string;
  if (specifier.startsWith('@/')) base = path.join(SRC, specifier.slice(2));
  else if (specifier.startsWith('.'))
    base = path.resolve(path.dirname(from), specifier);
  else return null;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`])
    if (
      /\.tsx?$/.test(candidate) &&
      existsSync(candidate) &&
      statSync(candidate).isFile()
    )
      return candidate;
  return null;
}

export function stringLiteralOf(node: ts.Node | undefined) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text;
  return null;
}

/** 타입만 가져오는 import는 번들에 들어가지 않으므로 뺀다. `import()`는 나중에 불러오는 것으로 표시한다. */
export function sourceInfoOf(file: string): SourceInfo {
  const cached = sources.get(file);
  if (cached) return cached;
  const text = readFileSync(file, 'utf8');
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const imports: ImportEdge[] = [];
  const add = (specifier: string, isLazy: boolean) =>
    imports.push({
      specifier,
      file: resolveImport(file, specifier),
      isLazy,
    });
  const visit = (node: ts.Node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      !(ts.isImportDeclaration(node) && node.importClause?.isTypeOnly) &&
      !(ts.isExportDeclaration(node) && node.isTypeOnly)
    )
      add(node.moduleSpecifier.text, false);
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      const specifier = stringLiteralOf(node.arguments[0]);
      if (specifier) add(specifier, true);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  const info = {
    source,
    isClient: /^\s*['"]use client['"]/.test(text),
    imports,
  };
  sources.set(file, info);
  return info;
}

/** 경계 파일('use client')부터 그 아래 import 전체가 브라우저에서 실행된다. includeLazy가 false면 첫 로드만 본다. */
export function clientFilesOf(entry: string, { includeLazy = true } = {}) {
  const client = new Set<string>();
  const seen = new Set<string>();
  const walk = (file: string, isClient: boolean) => {
    const info = sourceInfoOf(file);
    const inClient = isClient || info.isClient;
    const id = `${file}:${inClient}`;
    if (seen.has(id)) return;
    seen.add(id);
    if (inClient) client.add(file);
    for (const edge of info.imports)
      if (edge.file && (includeLazy || !edge.isLazy)) walk(edge.file, inClient);
  };
  walk(entry, false);
  return client;
}

/** app 아래 라우트 파일(page·layout·error 등). BFF 라우트는 뺀다. */
export function routeEntries(dir = APP): string[] {
  return readdirSync(dir)
    .flatMap((name) => {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory())
        return name === 'bff' ? [] : routeEntries(full);
      return ENTRY_NAMES.has(name) ? [full] : [];
    })
    .sort();
}
