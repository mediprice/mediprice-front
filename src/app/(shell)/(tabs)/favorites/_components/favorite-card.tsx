import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Tag } from '@/components/ui/tag';
import { FavoriteButton } from '@/features/favorites/components/favorite-button';
import type { FavoriteHospital } from '@/features/favorites/queries';
import { HospitalIdentity } from '@/features/hospitals/components/hospital-identity';
import { cn } from '@/lib/utils';

/** 관심 병원 한 줄. 줄 전체가 병원 상세 링크다(이름 링크를 줄 크기로 넓힌다). 하트는 링크 위에 따로 놓인다. */
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
        'relative -mx-3 flex items-center gap-2 rounded-xl py-4 pr-1 pl-3',
        isAvailable &&
          'transition-colors duration-200 ease-standard hover:bg-surface active:bg-surface-strong',
      )}
    >
      <HospitalIdentity
        as="h3"
        className="flex-1"
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
            <span className="text-body-sm text-text-secondary">
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
        className="relative shrink-0"
      />
      {isAvailable && (
        <ChevronRight
          aria-hidden="true"
          className="hidden size-5 shrink-0 text-text-tertiary md:block"
          strokeWidth={1.75}
        />
      )}
    </article>
  );
}
