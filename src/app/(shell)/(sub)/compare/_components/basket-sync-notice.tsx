'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  type CompareHospital,
  useCompareHydrated,
  useCompareStore,
} from '@/features/comparison/compare-store';

/**
 * 공유받은 비교가 내 비교함과 다르면 알리고, 원하면 이 비교로 비교함을 바꾼다. 비교함이 비어 있으면 자동으로 채우므로 보이지 않는다.
 */
export function BasketSyncNotice({
  hospitals,
}: {
  hospitals: readonly CompareHospital[];
}) {
  const t = useTranslations('comparison.basketSync');
  const isHydrated = useCompareHydrated();
  const basket = useCompareStore((state) => state.hospitals);
  const replaceWith = useCompareStore((state) => state.replaceWith);
  const isSame =
    basket.length === hospitals.length &&
    basket.every((entry) =>
      hospitals.some((hospital) => hospital.ykiho === entry.ykiho),
    );
  if (!isHydrated || basket.length === 0 || hospitals.length === 0 || isSame)
    return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface px-4 py-3 text-body-sm text-text-secondary">
      <p className="min-w-0 flex-1 basis-56">
        {t('notice', { count: basket.length })}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => replaceWith(hospitals)}
      >
        {t('replace')}
      </Button>
    </div>
  );
}
