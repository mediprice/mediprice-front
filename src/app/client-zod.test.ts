import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  APP,
  clientFilesOf,
  routeEntries,
  sourceInfoOf,
  SRC,
} from '@/test/client-graph';

/** 폼(react-hook-form + zod 스키마)이 첫 화면에 있는 라우트. 이 화면들만 zod classic을 첫 로드에 받는다. */
const FORM_ROUTES = [
  '(shell)/(tabs)/ai',
  '(shell)/admin',
  '(shell)/(sub)/hospitals/[ykiho]/review',
  '(shell)/(sub)/my/account',
  '(shell)/(sub)/my/medical-profile',
  '(shell)/(sub)/my/reviews',
].map((route) => path.join(APP, route));

const CLASSIC = new Set(['zod', 'zod/v4']);

const entries = routeEntries().filter(
  (entry) => !FORM_ROUTES.some((route) => entry.startsWith(`${route}/`)),
);

describe('셸과 공개 화면의 첫 로드', () => {
  it.each(entries.map((entry) => [path.relative(APP, entry), entry]))(
    '%s는 zod classic 대신 zod/mini만 쓴다',
    (_, entry) => {
      const classic = [...clientFilesOf(entry, { includeLazy: false })]
        .filter((file) =>
          sourceInfoOf(file).imports.some(
            (edge) => !edge.isLazy && CLASSIC.has(edge.specifier),
          ),
        )
        .map((file) => path.relative(SRC, file));
      expect(classic).toEqual([]);
    },
  );
});
