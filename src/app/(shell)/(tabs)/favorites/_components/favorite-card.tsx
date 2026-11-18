import { ChevronRight, Heart } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Tag } from '@/components/ui/tag';
import type { FavoriteHospital } from '@/features/favorites/queries';
import { cn } from '@/lib/utils';

/** 카드 전체가 병원 상세 링크다(제목 링크를 카드 크기로 넓힌다). 하트는 링크 위에 따로 놓여 관심에서 뺀다. */
export function FavoriteCard({
  favorite,
  onRemove,
}: {
  favorite: FavoriteHospital;
  onRemove: () => void;
}) {
  const t = useTranslations('library.favorites');
  const tButton = useTranslations('library.favoriteButton');
  const isAvailable = favorite.available;
  const name = favorite.name ?? t('unavailableName');
  const meta = [favorite.className, favorite.address]
    .filter(Boolean)
    .join(' · ');

  return (
    <article
      className={cn(
        'relative flex items-center gap-2 rounded-xl py-4 pr-2 pl-4 lg:gap-6 lg:py-6 lg:pr-6 lg:pl-6',
        isAvailable
          ? 'bg-bg shadow-card transition-shadow duration-150 ease-standard has-[a:hover]:shadow-float'
          : 'border border-hairline bg-surface',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-subheading break-keep">
          {isAvailable ? (
            <Link
              href={`/hospitals/${encodeURIComponent(favorite.ykiho)}`}
              className="rounded-sm after:absolute after:inset-0 after:rounded-xl hover:underline lg:hover:no-underline"
            >
              {name}
            </Link>
          ) : (
            <span className="text-text-secondary">{name}</span>
          )}
        </h3>
        {meta && <p className="text-body-sm text-text-secondary">{meta}</p>}
        {!isAvailable && (
          <p className="mt-1 flex flex-wrap items-center gap-2">
            <Tag>{t('unavailable')}</Tag>
            <span className="text-caption text-text-tertiary">
              {t('unavailableHint')}
            </span>
          </p>
        )}
      </div>
      {isAvailable && (
        <span
          aria-hidden="true"
          className="hidden shrink-0 items-center gap-0.5 text-label-bold text-primary-text lg:inline-flex"
        >
          {t('viewHospital')}
          <ChevronRight className="size-4" strokeWidth={2} />
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('remove', { name })}
        onClick={onRemove}
        className="relative z-10 self-start text-primary lg:size-auto lg:min-h-11 lg:self-center lg:rounded-full lg:bg-primary-tint lg:px-4 lg:hover:bg-primary-tint-hover"
      >
        <Heart aria-hidden="true" fill="currentColor" />
        <span aria-hidden="true" className="hidden lg:inline">
          {tButton('saved')}
        </span>
      </Button>
    </article>
  );
}
