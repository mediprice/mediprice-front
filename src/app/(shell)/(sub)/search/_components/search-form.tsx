'use client';

import { ArrowRight, ChevronDown, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  SERVICE_REGIONS,
  type ServiceRegion,
} from '@/features/regions/service-region';

/**
 * JS 없이도 동작하는 GET 폼. 모바일은 입력 줄 아래에 대상·지역 두 칸, lg부터 한 줄 검색 바다.
 * 검색어가 있으면 대상·지역을 바꾸는 즉시 다시 찾는다(바꾼 것처럼 보이는데 결과가 그대로인 일이 없게).
 */
export function SearchForm({
  type,
  keyword,
  region,
}: {
  type: 'item' | 'hospital';
  keyword: string;
  region: ServiceRegion;
}) {
  const t = useTranslations('search.form');
  const tRegion = useTranslations('common.region');
  return (
    <form
      action="/search"
      onChange={(event) => {
        const field = event.target;
        if (
          !(
            field instanceof HTMLInputElement ||
            field instanceof HTMLSelectElement
          ) ||
          (field.name !== 'type' && field.name !== 'region')
        )
          return;
        const form = event.currentTarget;
        const query = form.elements.namedItem('q');
        if (query instanceof HTMLInputElement && query.value.trim())
          form.requestSubmit();
      }}
      role="search"
      aria-label={t('label')}
      className="w-full overflow-hidden rounded-xl bg-bg shadow-card md:flex md:items-center md:gap-2 md:overflow-visible md:p-2"
    >
      <div className="flex min-h-13 items-center gap-2 pr-2 pl-3.5 md:order-2 md:min-h-11 md:flex-1 md:pr-0 md:pl-2">
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
          className="touch-target size-9 rounded-full md:hidden"
        >
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8.5rem),1fr))] gap-px border-t border-hairline bg-hairline md:contents">
        <fieldset className="flex min-w-0 flex-col gap-1 bg-bg px-3.5 py-2.5 md:order-1 md:p-0">
          <legend className="sr-only">{t('target')}</legend>
          <span
            aria-hidden="true"
            className="text-caption text-text-tertiary md:hidden"
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

        <label className="flex min-w-0 flex-col bg-bg px-3.5 pt-2.5 pb-1 md:order-3 md:w-36 md:border-l md:border-hairline md:p-0 md:pl-3.5">
          <span className="text-caption text-text-tertiary md:sr-only">
            {t('region')}
          </span>
          <span className="relative flex items-center">
            <select
              name="region"
              defaultValue={region}
              className="min-h-11 w-full appearance-none rounded-md bg-transparent pr-7 text-field text-text-primary -outline-offset-2"
            >
              {SERVICE_REGIONS.map((value) => (
                <option key={value} value={value}>
                  {tRegion(value)}
                </option>
              ))}
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
        className="hidden md:order-4 md:inline-flex md:px-6"
      >
        {t('submit')}
      </Button>
    </form>
  );
}
