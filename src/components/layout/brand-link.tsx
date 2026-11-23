import { Tag } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

/** 임시 심볼과 워드마크. 폭이 모자라면(큰 글자) 워드마크가 다음 줄로 밀려 잘리고, 글자는 DOM에 남아 링크 이름이 된다. */
export function BrandLink() {
  const t = useTranslations('common');
  return (
    <Link
      href="/"
      className="inline-flex h-11 max-w-full min-w-0 flex-wrap content-start items-center gap-x-2 overflow-hidden rounded-md text-text-primary"
    >
      <span aria-hidden="true" className="flex h-11 shrink-0 items-center">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-on-primary">
          <Tag className="size-4" strokeWidth={1.75} />
        </span>
      </span>
      <span className="text-subheading whitespace-nowrap">{t('brand')}</span>
    </Link>
  );
}
