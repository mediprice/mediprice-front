import { useTranslations } from 'next-intl';

import { HOME_CATEGORIES } from '@/features/npay/catalog';

type FriendlyCode = (typeof HOME_CATEGORIES)[number]['categoryCodes'][number];

const FRIENDLY_CODES: readonly string[] = HOME_CATEGORIES.flatMap(
  (category) => category.categoryCodes,
);

function isFriendlyCode(code: string): code is FriendlyCode {
  return FRIENDLY_CODES.includes(code);
}

/** 홈 분야에 든 대분류는 공식 이름("이학요법료") 대신 쉬운 이름("물리치료·재활")으로 보여 준다. */
export function useCategoryLabel() {
  const t = useTranslations('common.category');
  return (code: string | null | undefined, officialName: string) =>
    code && isFriendlyCode(code) ? t(code) : officialName;
}
