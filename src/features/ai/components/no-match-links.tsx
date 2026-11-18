import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Chip } from '@/components/ui/chip';

/** 맞는 항목이 없을 때 직접 찾을 수 있는 길. */
export function NoMatchLinks() {
  const t = useTranslations('ai.noMatch');
  return (
    <div className="flex flex-wrap gap-2">
      <Chip asChild>
        <Link href={{ pathname: '/search', query: { category: 'all' } }}>
          {t('category')}
        </Link>
      </Chip>
      <Chip asChild>
        <Link href="/search">{t('search')}</Link>
      </Chip>
    </div>
  );
}
