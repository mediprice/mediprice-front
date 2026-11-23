import { existsSync } from 'node:fs';
import path from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import {
  APP,
  clientFilesOf,
  routeEntries,
  sourceInfoOf,
  SRC,
  stringLiteralOf,
} from '@/test/client-graph';

import { CLIENT_NAMESPACES } from './message-scope';
import { messages } from './messages/ko';

const T_METHODS = new Set(['rich', 'markup', 'raw', 'has']);

type Messages = { paths: Set<string>; scoped: string[] | null };

const analyzed = new Map<string, Messages>();

function keyPrefixOf(node: ts.Node | undefined) {
  const literal = stringLiteralOf(node);
  if (literal !== null) return literal;
  if (node && ts.isTemplateExpression(node)) {
    const head = node.head.text;
    return head.slice(0, Math.max(head.lastIndexOf('.'), 0));
  }
  return '';
}

function join(prefix: string, key: string) {
  return [prefix, key].filter(Boolean).join('.');
}

/** 번역 함수가 읽는 키 경로. 키를 코드에서 알 수 없으면 번역 함수의 접두어 전체를 쓴다고 본다. */
function keysReadBy(translator: ts.Identifier, prefix: string) {
  const keys = new Set<string>();
  let scope: ts.Node = translator.parent;
  while (!ts.isFunctionLike(scope) && scope.parent) scope = scope.parent;
  const visit = (node: ts.Node) => {
    if (
      ts.isIdentifier(node) &&
      node !== translator &&
      node.text === translator.text
    ) {
      const parent = node.parent;
      const call =
        ts.isCallExpression(parent) && parent.expression === node
          ? parent
          : ts.isPropertyAccessExpression(parent) &&
              parent.expression === node &&
              T_METHODS.has(parent.name.text) &&
              ts.isCallExpression(parent.parent) &&
              parent.parent.expression === parent
            ? parent.parent
            : null;
      keys.add(join(prefix, call ? keyPrefixOf(call.arguments[0]) : ''));
    }
    ts.forEachChild(node, visit);
  };
  visit(scope);
  return keys;
}

/** 이 파일이 읽는 메시지 경로와 ClientMessages로 더하는 경로를 모은다. */
function messagesOf(file: string): Messages {
  const cached = analyzed.get(file);
  if (cached) return cached;
  const info: Messages = { paths: new Set(), scoped: null };
  analyzed.set(file, info);

  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'useTranslations'
    ) {
      const arg = node.arguments[0];
      const prefix = stringLiteralOf(arg);
      if (arg && prefix === null)
        throw new Error(`useTranslations(${arg.getText()}) in ${file}`);
      const target = node.parent;
      if (ts.isVariableDeclaration(target) && ts.isIdentifier(target.name))
        for (const key of keysReadBy(target.name, prefix ?? ''))
          info.paths.add(key);
      else info.paths.add(prefix ?? '');
    }
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText() === 'namespaces' &&
      ts.isJsxOpeningLikeElement(node.parent.parent) &&
      node.parent.parent.tagName.getText() === 'ClientMessages'
    ) {
      const expression =
        node.initializer && ts.isJsxExpression(node.initializer)
          ? node.initializer.expression
          : undefined;
      if (!expression || !ts.isArrayLiteralExpression(expression))
        throw new Error(`ClientMessages namespaces must be an array: ${file}`);
      info.scoped = expression.elements.map((element) => {
        const literal = stringLiteralOf(element);
        if (literal === null)
          throw new Error(
            `ClientMessages namespaces must be literals: ${file}`,
          );
        return literal;
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceInfoOf(file).source);
  return info;
}

/** 그 화면에서 브라우저가 실행하는 컴포넌트가 읽는 키와, 그 키를 처음 읽은 파일. */
function clientNamespacesOf(entry: string) {
  const namespaces = new Map<string, string>();
  for (const file of clientFilesOf(entry))
    for (const key of messagesOf(file).paths)
      if (!namespaces.has(key)) namespaces.set(key, path.relative(SRC, file));
  return namespaces;
}

/** 이 파일과 조상 레이아웃이 ClientMessages로 더한 네임스페이스. 루트 레이아웃은 CLIENT_NAMESPACES를 넘긴다. */
function scopedNamespacesOf(entry: string) {
  const scoped = new Set<string>(messagesOf(entry).scoped ?? []);
  for (let dir = path.dirname(entry); dir.startsWith(APP);) {
    const layout = path.join(dir, 'layout.tsx');
    if (existsSync(layout) && path.basename(entry) !== 'global-error.tsx')
      for (const namespace of messagesOf(layout).scoped ?? [])
        scoped.add(namespace);
    if (dir === APP) break;
    dir = path.dirname(dir);
  }
  return scoped;
}

function covers(scope: Iterable<string>, key: string) {
  for (const prefix of scope)
    if (key === prefix || key.startsWith(`${prefix}.`)) return true;
  return false;
}

function hasPath(key: string) {
  let node: unknown = messages;
  for (const segment of key.split('.')) {
    if (typeof node !== 'object' || node === null || !(segment in node))
      return false;
    node = (node as Record<string, unknown>)[segment];
  }
  return true;
}

const entries = routeEntries();

describe('브라우저에 넘기는 메시지', () => {
  it('루트는 서버 화면 전용 legal·admin 전체를 넘기지 않는다', () => {
    expect(CLIENT_NAMESPACES).not.toContain('legal');
    expect(CLIENT_NAMESPACES).not.toContain('admin');
    expect(Object.keys(messages).length).toBeGreaterThan(
      CLIENT_NAMESPACES.length,
    );
  });

  it('클라이언트 컴포넌트가 읽는 키를 코드에서 찾는다', () => {
    const home = entries.find((entry) =>
      entry.endsWith(path.join('(tabs)', 'page.tsx')),
    );
    expect(home).toBeDefined();
    expect([...clientNamespacesOf(home ?? '').keys()]).toContain(
      'home.recent.title',
    );
  });

  it.each(entries.map((entry) => [path.relative(APP, entry), entry]))(
    '%s의 클라이언트 컴포넌트가 읽는 키는 모두 그 화면의 provider에 있다',
    (_, entry) => {
      const scope = [
        ...(path.basename(entry) === 'global-error.tsx'
          ? []
          : CLIENT_NAMESPACES),
        ...scopedNamespacesOf(entry),
      ];
      const missing = [...clientNamespacesOf(entry)]
        .filter(([key]) => !covers(scope, key))
        .map(([key, file]) => `${key} (${file})`);
      expect(missing).toEqual([]);
    },
  );

  it('provider에 넘기는 경로는 메시지 파일에 있다', () => {
    const declared = new Set<string>(CLIENT_NAMESPACES);
    for (const entry of entries)
      for (const key of scopedNamespacesOf(entry)) declared.add(key);
    expect([...declared].filter((key) => !hasPath(key))).toEqual([]);
  });
});
