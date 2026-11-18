import { Tag } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

/** 최종 로고가 정해지기 전까지 쓰는 임시 심볼(가격표 아이콘)과 워드마크. */
export function BrandLink() {
  const t = useTranslations('common');
  return (
    <Link
      href="/"
      className="inline-flex h-11 max-w-full min-w-0 items-center gap-2 rounded-md text-text-primary"
    >
      <span
        aria-hidden="true"
        className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary"
      >
        <Tag className="size-4" strokeWidth={2} />
      </span>
      <span className="truncate text-subheading">{t('brand')}</span>
    </Link>
  );
}
