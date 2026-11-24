import { useTranslations } from 'next-intl';

/** 키보드 사용자가 내비게이션을 건너뛰고 본문(id="main")으로 바로 가게 한다. */
export function SkipLink() {
  const t = useTranslations('nav');
  return (
    <a
      href="#main"
      className="sr-only rounded-lg bg-primary px-4 py-3 text-label-bold text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-(--z-skip-link) focus:px-4 focus:py-3"
    >
      {t('skipToContent')}
    </a>
  );
}
