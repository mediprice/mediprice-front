import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

/** 맞는 항목이 없을 때 직접 찾을 수 있는 길. 카테고리를 앞세우고 검색은 ghost로 둔다. */
export function NoMatchLinks() {
  const t = useTranslations('ai.noMatch');
  return (
    <div className="flex flex-col items-start gap-1">
      <Button asChild variant="tint" size="md">
        <Link href={{ pathname: '/search', query: { category: 'all' } }}>
          {t('category')}
        </Link>
      </Button>
      <Button asChild variant="ghost" size="md">
        <Link href="/search">{t('search')}</Link>
      </Button>
    </div>
  );
}
