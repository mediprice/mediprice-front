import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { BrandSymbol } from '@/components/ui/brand-symbol';

/** 심볼과 워드마크. 폭이 모자라면(큰 글자) 워드마크가 다음 줄로 밀려 잘리고, 글자는 DOM에 남아 링크 이름이 된다. */
export function BrandLink() {
  const t = useTranslations('common');
  /** 상단 바가 화면 크기별로 두 번 그려지므로 그라디언트 id가 겹치지 않게 한다. */
  const idPrefix = useId().replace(/[^\w-]/g, '');
  return (
    <Link
      href="/"
      className="inline-flex h-11 max-w-full min-w-0 flex-wrap content-start items-center gap-x-2 overflow-hidden rounded-md text-text-primary"
    >
      <span aria-hidden="true" className="flex h-11 shrink-0 items-center">
        <BrandSymbol variant="small" idPrefix={idPrefix} className="size-8" />
      </span>
      <span className="text-subheading whitespace-nowrap">{t('brand')}</span>
    </Link>
  );
}
