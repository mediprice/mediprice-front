import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Tag } from '@/components/ui/tag';
import { FavoriteButton } from '@/features/favorites/components/favorite-button';
import type { FavoriteHospital } from '@/features/favorites/queries';
import { HospitalIdentity } from '@/features/hospitals/components/hospital-identity';
import { cn } from '@/lib/utils';

/** 카드 전체가 병원 상세 링크다(이름 링크를 카드 크기로 넓힌다). 하트는 링크 위에 따로 놓인다. */
export function FavoriteCard({
  favorite,
  onRemove,
}: {
  favorite: FavoriteHospital;
  /** 하트를 누르면 부모가 빼고 되돌리기를 띄운다. */
  onRemove: () => void;
}) {
  const t = useTranslations('library.favorites');
  const isAvailable = favorite.available;
  const name = favorite.name ?? t('unavailableName');
  const meta = [favorite.className, favorite.address]
    .filter(Boolean)
    .join(' · ');

  return (
    <article
      className={cn(
        'relative flex h-full items-start gap-1 rounded-xl bg-bg py-4 pr-1 pl-4 lg:py-5 lg:pl-5',
        isAvailable
          ? 'pressable shadow-card'
          : 'border border-dashed border-border-strong',
      )}
    >
      <HospitalIdentity
        as="h3"
        className="flex-1 pt-0.5"
        nameClassName={cn(!isAvailable && 'text-text-secondary')}
        name={
          isAvailable ? (
            <Link
              href={`/hospitals/${encodeURIComponent(favorite.ykiho)}`}
              className="rounded-sm after:absolute after:inset-0 after:rounded-xl"
            >
              {name}
            </Link>
          ) : (
            name
          )
        }
        meta={meta || undefined}
      >
        {!isAvailable && (
          <p className="mt-1 flex flex-wrap items-center gap-2">
            <Tag>{t('unavailable')}</Tag>
            <span className="text-caption text-text-tertiary">
              {t('unavailableHint')}
            </span>
          </p>
        )}
      </HospitalIdentity>
      <FavoriteButton
        ykiho={favorite.ykiho}
        hospital={{ ...favorite, name }}
        variant="icon"
        onToggle={(isFavorite) => {
          if (!isFavorite) onRemove();
        }}
        className="relative -mt-2.5 shrink-0"
      />
    </article>
  );
}
