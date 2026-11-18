import Link from 'next/link';
import { useTranslations } from 'next-intl';

/** 최종 로고가 정해지기 전까지 Figma 헤더의 색 타일과 워드마크로 대신한다. */
export function BrandLink() {
  const t = useTranslations('common');
  return (
    <Link href="/" className="flex items-center gap-2">
      <span aria-hidden="true" className="size-7 rounded-md bg-primary" />
      <span className="text-subheading">{t('brand')}</span>
    </Link>
  );
}
