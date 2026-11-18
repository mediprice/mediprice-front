import { ArrowRight, ChevronDown, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import type { Region } from '@/features/search/search-params';

/** JS 없이 동작하는 GET 폼. 모바일은 입력 줄 아래에 대상·지역 두 칸, lg부터 한 줄 검색 바다. */
export function SearchForm({
  type,
  keyword,
  region,
}: {
  type: 'item' | 'hospital';
  keyword: string;
  region: Region;
}) {
  const t = useTranslations('search.form');
  return (
    <form
      action="/search"
      role="search"
      aria-label={t('label')}
      className="w-full overflow-hidden rounded-xl bg-bg shadow-card lg:flex lg:max-w-190 lg:items-center lg:gap-2 lg:overflow-visible lg:p-2"
    >
      <div className="flex min-h-13 items-center gap-2 pr-2 pl-3.5 lg:order-2 lg:min-h-11 lg:flex-1 lg:pr-0 lg:pl-2">
        <label className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="sr-only">{t('keyword')}</span>
          <Search
            aria-hidden="true"
            className="size-5 shrink-0 text-text-tertiary"
            strokeWidth={1.75}
          />
          <input
            name="q"
            type="search"
            required
            defaultValue={keyword}
            enterKeyHint="search"
            autoComplete="off"
            placeholder={t('keywordPlaceholder')}
            className="min-h-11 w-full min-w-0 rounded-md bg-transparent text-field text-text-primary -outline-offset-2 placeholder:text-text-tertiary"
          />
        </label>
        <Button
          type="submit"
          size="icon"
          variant="tint"
          aria-label={t('submit')}
          className="touch-target size-9 rounded-full lg:hidden"
        >
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>

      <div className="flex divide-x divide-hairline border-t border-hairline lg:contents">
        <fieldset className="flex min-w-0 flex-1 flex-col gap-1 px-3.5 py-2.5 lg:order-1 lg:flex-none lg:p-0">
          <legend className="sr-only">{t('target')}</legend>
          <span
            aria-hidden="true"
            className="text-caption text-text-tertiary lg:hidden"
          >
            {t('target')}
          </span>
          <div className="flex w-fit rounded-md bg-surface-strong p-1">
            {(['item', 'hospital'] as const).map((value) => (
              <label key={value} className="touch-target cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={value}
                  defaultChecked={value === type}
                  className="peer sr-only"
                />
                <span className="flex min-h-9 items-center rounded-md px-3.5 text-label text-text-secondary peer-checked:bg-primary peer-checked:text-label-bold peer-checked:text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring">
                  {value === 'item' ? t('targetItem') : t('targetHospital')}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex min-w-0 flex-1 flex-col gap-1 px-3.5 py-2.5 lg:order-3 lg:w-40 lg:flex-none lg:py-0">
          <span className="text-caption text-text-tertiary lg:sr-only">
            {t('region')}
          </span>
          <span className="relative flex items-center">
            <select
              name="region"
              defaultValue={region}
              className="min-h-9 w-full appearance-none rounded-md bg-transparent pr-7 text-label-bold text-text-primary -outline-offset-2 lg:min-h-11 lg:text-label"
            >
              <option value="all">{t('regionAll')}</option>
              <option value="seoul">{t('regionSeoul')}</option>
              <option value="gyeonggi">{t('regionGyeonggi')}</option>
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-0 size-5 text-text-tertiary"
              strokeWidth={1.75}
            />
          </span>
        </label>
      </div>

      <Button
        type="submit"
        size="md"
        elevated
        className="hidden lg:order-4 lg:inline-flex lg:px-6"
      >
        {t('submit')}
      </Button>
    </form>
  );
}
