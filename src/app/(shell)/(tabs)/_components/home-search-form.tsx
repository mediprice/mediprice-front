import { ChevronDown, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

/** JS 없이 동작하는 GET 폼. /search가 type·q·region 파라미터를 읽는다. */
export function HomeSearchForm() {
  const t = useTranslations('home.search');
  return (
    <form
      action="/search"
      role="search"
      aria-label={t('label')}
      className="flex w-full min-w-0 flex-col gap-4 lg:max-w-3xl lg:flex-row lg:items-center lg:gap-2 lg:rounded-xl lg:bg-bg lg:p-2 lg:shadow-card"
    >
      <div className="flex min-w-0 flex-col rounded-xl bg-bg shadow-card lg:flex-1 lg:flex-row lg:items-center lg:rounded-none lg:shadow-none">
        <fieldset className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3 lg:border-b-0 lg:p-0">
          <legend className="sr-only">{t('target')}</legend>
          <span
            aria-hidden="true"
            className="text-caption-strong text-text-tertiary lg:hidden"
          >
            {t('target')}
          </span>
          <div className="flex max-w-full min-w-0 rounded-md bg-surface-strong p-1">
            {(['item', 'hospital'] as const).map((type) => (
              <label
                key={type}
                className="touch-target min-w-0 flex-1 cursor-pointer"
              >
                <input
                  type="radio"
                  name="type"
                  value={type}
                  defaultChecked={type === 'item'}
                  className="peer sr-only"
                />
                <span className="flex min-h-10 items-center justify-center rounded-md px-3 text-label text-text-secondary peer-checked:bg-primary peer-checked:text-label-bold peer-checked:text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring lg:px-4">
                  {type === 'item' ? t('targetItem') : t('targetHospital')}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1 border-b border-hairline px-4 py-3 lg:flex-1 lg:border-b-0 lg:py-0">
          <span className="text-caption-strong text-text-tertiary lg:sr-only">
            {t('keyword')}
          </span>
          <span className="flex items-center gap-2.5">
            <Search
              aria-hidden="true"
              className="size-5 shrink-0 text-text-tertiary"
              strokeWidth={1.75}
            />
            <input
              name="q"
              type="search"
              required
              enterKeyHint="search"
              autoComplete="off"
              placeholder={t('keywordPlaceholder')}
              className="min-h-11 w-full min-w-0 rounded-md bg-transparent text-field text-text-primary -outline-offset-2 placeholder:text-text-tertiary"
            />
          </span>
        </label>

        <label className="flex flex-col gap-1 px-4 py-3 lg:w-44 lg:border-l lg:border-hairline lg:py-0">
          <span className="text-caption-strong text-text-tertiary lg:sr-only">
            {t('region')}
          </span>
          <span className="relative flex items-center">
            <select
              name="region"
              defaultValue="metro"
              className="min-h-11 w-full appearance-none rounded-md bg-transparent pr-8 text-field text-text-primary -outline-offset-2"
            >
              <option value="metro">{t('regionAll')}</option>
              <option value="seoul">{t('regionSeoul')}</option>
              <option value="gyeonggi">{t('regionGyeonggi')}</option>
              <option value="all">{t('regionNationwide')}</option>
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-0 size-5 text-text-tertiary"
              strokeWidth={1.75}
            />
          </span>
        </label>
      </div>

      <Button type="submit" elevated className="w-full lg:w-auto lg:px-8">
        {t('submit')}
      </Button>
    </form>
  );
}
