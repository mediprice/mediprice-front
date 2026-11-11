import pluginQuery from '@tanstack/eslint-plugin-query';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

const TESTS = ['**/*.test.{ts,tsx}'];

/** 의존 방향(docs/coding-convention.md 2.2). 아래 계층은 위 계층을 import하지 않는다. */
function layerBoundaries() {
  const restrict = (files, forbidden, message, ignores = TESTS) => ({
    files,
    ignores,
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: forbidden, message }] },
      ],
    },
  });

  return [
    restrict(
      ['src/lib/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
      ['@/features/*', '@/app/*', '@/server/*'],
      'lib과 components는 도메인·화면·서버 코드를 import할 수 없습니다. 도메인을 알면 features에 두세요.',
    ),
    restrict(
      ['src/features/**/*.{ts,tsx}'],
      ['@/app/*', '@/server/*'],
      'features는 app과 server를 import할 수 없습니다. server는 BFF 라우트(app/bff)만 사용합니다.',
    ),
    restrict(
      ['src/app/**/*.{ts,tsx}'],
      ['@/server/*'],
      '화면 코드는 server를 import할 수 없습니다. app/bff 라우트만 사용할 수 있습니다.',
      [...TESTS, 'src/app/bff/**'],
    ),
    restrict(
      ['src/server/**/*.{ts,tsx}'],
      ['@/features/*', '@/app/*'],
      'server는 features와 app을 import할 수 없습니다.',
    ),
  ];
}

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  ...pluginQuery.configs['flat/recommended'],
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    plugins: {
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  ...layerBoundaries(),
  prettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'dist/**',
    'coverage/**',
    'next-env.d.ts',
    'src/lib/api/schema.d.ts',
  ]),
]);
