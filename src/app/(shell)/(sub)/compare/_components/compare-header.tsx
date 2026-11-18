import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
} from '@/components/layout/breadcrumb';
import { PageContainer } from '@/components/layout/page-container';

export function CompareHeader({
  item,
  itemName,
  count,
}: {
  item: string | null;
  itemName: string | null;
  /** 불러오기 전이거나 실패하면 null이고, 제목은 "병원 비교"가 된다. */
  count: number | null;
}) {
  const t = useTranslations('comparison.page');
  const title =
    count == null
      ? t('fallbackTitle')
      : itemName
        ? t('titleWithItem', { item: itemName, count })
        : t('title', { count });

  return (
    <div className="bg-primary-tint">
      <PageContainer className="flex flex-col gap-2.5 pt-6 pb-5 lg:pt-6 lg:pb-8">
        <Breadcrumb>
          <BreadcrumbLink href="/">{t('breadcrumbHome')}</BreadcrumbLink>
          {item && itemName && (
            <BreadcrumbLink href={`/items/${item}`}>{itemName}</BreadcrumbLink>
          )}
          <BreadcrumbCurrent>{t('breadcrumbCurrent')}</BreadcrumbCurrent>
        </Breadcrumb>
        <h1 className="text-display">{title}</h1>
        <p className="flex items-center gap-1.5 text-body-sm text-text-tertiary">
          <Info
            aria-hidden="true"
            className="size-4 shrink-0"
            strokeWidth={1.75}
          />
          {t('source')}
        </p>
      </PageContainer>
    </div>
  );
}
