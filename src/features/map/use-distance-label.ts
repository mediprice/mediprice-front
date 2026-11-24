import { useTranslations } from 'next-intl';

/** 1km 미만은 m, 이상은 km로 쓴다. */
export function useDistanceLabel(meters: number) {
  const t = useTranslations('map.card');
  return meters < 1000
    ? t('meters', { value: meters })
    : t('kilometers', { value: meters / 1000 });
}
