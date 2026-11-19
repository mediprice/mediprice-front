import { ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import type { ServiceRegion } from '@/features/regions/service-region';

import { suggestionHref, type SuggestionId } from './suggestion-href';

/** 데스크톱 오른쪽 열(모바일은 목록 아래). 다른 찾기 방법과 AI로 이어 준다. */
export function SearchSuggestions({
  links,
  keyword,
  region,
  title,
  showPriceNotice = false,
}: {
  links: SuggestionId[];
  keyword: string;
  region: ServiceRegion;
  title: string;
  showPriceNotice?: boolean;
}) {
  const t = useTranslations('search.suggestions');
  return (
    <aside aria-label={title} className="space-y-4 lg:sticky lg:top-24">
      <section className="space-y-1 rounded-xl bg-bg p-4 lg:space-y-2.5 lg:bg-surface lg:p-6">
        <h2 className="text-label-bold lg:text-subheading">{title}</h2>
        <ul className="divide-y divide-hairline lg:space-y-2.5 lg:divide-y-0">
          {links.map((id) => (
            <li key={id}>
              <Link
                href={suggestionHref(id, keyword, region)}
                className="flex min-h-11 items-center gap-2 py-3 hover:text-primary-text lg:rounded-lg lg:bg-bg lg:py-3.5 lg:pr-3.5 lg:pl-4"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-label">{t(`${id}.title`)}</span>
                  <span className="block text-caption text-text-tertiary lg:text-body-sm lg:text-text-secondary">
                    {t(`${id}.description`)}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-5 shrink-0 text-text-tertiary"
                  strokeWidth={1.75}
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Link
        href="/ai"
        className="flex items-center gap-3 rounded-xl bg-primary-tint p-4 hover:bg-primary-tint-hover lg:px-6 lg:py-5.5"
      >
        <Sparkles
          aria-hidden="true"
          className="size-5 shrink-0 text-primary"
          strokeWidth={1.75}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-label-bold text-primary-text">
            {t('ai.title')}
          </span>
          <span className="block text-body-sm text-text-primary">
            {t('ai.description')}
          </span>
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-5 shrink-0 text-primary-text"
          strokeWidth={1.75}
        />
      </Link>

      {showPriceNotice && (
        <p className="text-body-sm text-text-secondary">{t('notice')}</p>
      )}
    </aside>
  );
}
