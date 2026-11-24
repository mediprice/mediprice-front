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
  // flat config는 같은 파일에 걸린 no-restricted-imports 중 마지막 것만 쓰므로, 파일 묶음마다 패턴을 합쳐 한 번만 건다.
  const restrict = (files, patterns, ignores = TESTS) => ({
    files,
    ignores,
    rules: { 'no-restricted-imports': ['error', { patterns }] },
  });
  const noDomain = {
    group: ['@/features/*', '@/app/*', '@/server/*'],
    message:
      'lib과 components는 도메인·화면·서버 코드를 import할 수 없습니다. 도메인을 알면 features에 두세요.',
  };
  const noPrimitives = {
    group: ['@/components/primitives/*'],
    message:
      'shadcn 생성물은 components/ui에서 감싸서 씁니다. @/components/ui를 import하세요.',
  };

  return [
    restrict(
      ['src/lib/**/*.{ts,tsx}', 'src/components/layout/**/*.{ts,tsx}'],
      [noDomain, noPrimitives],
    ),
    restrict(
      [
        'src/components/ui/**/*.{ts,tsx}',
        'src/components/primitives/**/*.{ts,tsx}',
      ],
      [noDomain],
    ),
    restrict(
      ['src/features/**/*.{ts,tsx}'],
      [
        {
          group: ['@/app/*', '@/server/*'],
          message:
            'features는 app과 server를 import할 수 없습니다. server는 BFF 라우트(app/bff)만 사용합니다.',
        },
        noPrimitives,
      ],
    ),
    restrict(
      ['src/app/**/*.{ts,tsx}'],
      [
        {
          group: ['@/server/*', '!@/server/api'],
          message:
            '화면 코드는 server를 import할 수 없습니다. app/bff 라우트와 서버 컴포넌트의 공개 조회(server/api)만 사용할 수 있습니다.',
        },
        noPrimitives,
      ],
      [...TESTS, 'src/app/bff/**'],
    ),
    restrict(
      ['src/server/**/*.{ts,tsx}'],
      [
        {
          group: ['@/features/*', '@/app/*'],
          message: 'server는 features와 app을 import할 수 없습니다.',
        },
      ],
    ),
  ];
}

const HANGUL = '/[ㄱ-ㅎㅏ-ㅣ가-힣]/';
const TAILWIND_PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const SHADCN_ALIASES =
  'background|foreground|card|card-foreground|popover|popover-foreground|primary-foreground|secondary|secondary-foreground|muted|muted-foreground|accent|accent-foreground|destructive|ring';
const COLOR_UTILITIES =
  'bg|text|border|ring|outline|fill|stroke|from|via|to|divide|placeholder|decoration|accent|caret';
/** 기본 팔레트, white/black, shadcn 별칭 색과 Tailwind 기본 글자 크기. 우리 코드는 globals.css의 Figma 토큰만 쓴다. */
const RAW_STYLE = `/(^|[\\s:])-?(${COLOR_UTILITIES})-((${TAILWIND_PALETTE})-[0-9]+|white|black|${SHADCN_ALIASES})\\b|(^|[\\s:])text-(xs|sm|base|lg|[2-9]?xl)\\b/`;

/** 화면 문구·디자인 토큰·날짜 포맷 규칙(docs/coding-convention.md 8장, 12장). */
function uiTextAndTokens() {
  const restricted = (selector, message) => ({ selector, message });
  const TEXT =
    '화면 문구는 src/i18n/messages/ko/<네임스페이스>.json에 두고 키로 씁니다.';
  const TOKEN =
    'Tailwind 기본 팔레트·글자 크기·shadcn 별칭 대신 globals.css의 토큰을 씁니다.';
  const FORMAT =
    '날짜·숫자는 next-intl의 useFormatter/getFormatter로 포맷합니다(Asia/Seoul 고정).';

  return {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      ...TESTS,
      'src/server/**',
      'src/app/bff/**',
      'src/components/primitives/**',
    ],
    rules: {
      'react/jsx-no-literals': [
        'error',
        {
          noStrings: true,
          ignoreProps: true,
          allowedStrings: [
            '·',
            '/',
            '~',
            '-',
            '–',
            '(',
            ')',
            ':',
            ',',
            '|',
            '%',
            '+',
            '×',
            '…',
            '*',
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        restricted(`Literal[value=${HANGUL}]`, TEXT),
        restricted(`TemplateElement[value.raw=${HANGUL}]`, TEXT),
        restricted(`Literal[value=${RAW_STYLE}]`, TOKEN),
        restricted(`TemplateElement[value.raw=${RAW_STYLE}]`, TOKEN),
        restricted(
          "JSXExpressionContainer > MemberExpression[property.name='message']",
          '에러의 message는 화면에 출력하지 않습니다. errorMessageKey()로 문구 키를 고르세요.',
        ),
        restricted(
          'CallExpression[callee.property.name=/^toLocale(Date|Time)?String$/]',
          FORMAT,
        ),
        restricted("NewExpression[callee.object.name='Intl']", FORMAT),
      ],
    },
  };
}

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  ...pluginQuery.configs['flat/recommended'],
  {
    rules: {
      /** 같은 쿼리를 브라우저(BFF)와 서버(공개 백엔드)가 다른 클라이언트로 읽어 한 키로 하이드레이션한다. */
      '@tanstack/query/exhaustive-deps': [
        'error',
        { allowlist: { types: ['ApiClient'] } },
      ],
    },
  },
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
  uiTextAndTokens(),
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
