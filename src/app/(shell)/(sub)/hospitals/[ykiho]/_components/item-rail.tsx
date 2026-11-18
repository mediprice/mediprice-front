import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/** 데스크톱 오른쪽 열. 모바일에서는 같은 안내와 링크가 가격 목록·선택 항목 카드 안에 있다. */
export function ItemRail({
  item,
  itemName,
}: {
  item: string | null;
  itemName: string | undefined;
}) {
  const t = useTranslations('hospitals.detail');

  return (
    <aside className="hidden shrink-0 lg:sticky lg:top-[calc(var(--spacing-top-nav)+1.5rem)] lg:block lg:w-85">
      <div className="flex flex-col gap-3 rounded-xl bg-surface p-6">
        {item ? (
          <>
            <p className="text-caption text-text-secondary">
              {itemName ? (
                t('selected.label', { name: itemName })
              ) : (
                <Skeleton className="h-4 w-32" />
              )}
            </p>
            <p className="text-body-sm text-text-secondary">
              {t('rail.compareDescription')}
            </p>
            <Button asChild size="md" className="w-full">
              <Link href={`/items/${item}`}>
                {t('selected.compare')}
                <ChevronRight aria-hidden="true" />
              </Link>
            </Button>
          </>
        ) : (
          <>
            <p className="text-subheading">{t('rail.emptyTitle')}</p>
            <p className="text-body-sm text-text-secondary">
              {t('rail.emptyDescription')}
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
