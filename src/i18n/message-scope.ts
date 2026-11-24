import type { AbstractIntlMessages } from 'next-intl';

/** 셸(내비게이션·로그인·동의·토스트·비교함)과 여러 화면이 함께 쓰는 문구. 화면 전용 문구는 그 화면이 ClientMessages로 더한다. */
export const CLIENT_NAMESPACES = [
  'common',
  'nav',
  'errors',
  'auth',
  'library.favoriteButton',
  'comparison.toggle',
  'comparison.tray',
  'comparison.announce',
  'comparison.clearDialog',
] as const;

function isTree(value: unknown): value is AbstractIntlMessages {
  return typeof value === 'object' && value !== null;
}

/** 점으로 이은 경로(`legal.document`)의 하위 묶음만 남긴다. 없는 경로는 건너뛴다. */
export function pickMessages(
  messages: AbstractIntlMessages,
  paths: readonly string[],
): AbstractIntlMessages {
  const picked: AbstractIntlMessages = {};
  for (const key of paths) {
    const segments = key.split('.');
    let source: AbstractIntlMessages | string | undefined = messages;
    let target = picked;
    segments.forEach((segment, index) => {
      source = isTree(source) ? source[segment] : undefined;
      if (source === undefined) return;
      if (index === segments.length - 1) {
        target[segment] = source;
        return;
      }
      const next = target[segment];
      target = isTree(next) ? next : (target[segment] = {});
    });
  }
  return picked;
}

export function mergeMessages(
  base: AbstractIntlMessages,
  extra: AbstractIntlMessages,
): AbstractIntlMessages {
  const merged: AbstractIntlMessages = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    const current = merged[key];
    merged[key] =
      isTree(current) && isTree(value) ? mergeMessages(current, value) : value;
  }
  return merged;
}
