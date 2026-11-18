import { ArrowRight, ChevronDown, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  SERVICE_REGIONS,
  type ServiceRegion,
} from '@/features/regions/service-region';

/** JS 없이 동작하는 GET 폼. 모바일은 큰 입력 줄 아래에 대상·지역 두 칸, md부터 한 줄 검색 바다. 큰 글자로 입력 칸이 10rem보다 좁아지면 검색 버튼이 아래 줄로 내려간다. 테두리는 컨트롤 대비(3:1)를 지키고 포커스가 들어오면 파랗게 바뀐다. */
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
      role="search"
      aria-label={t('label')}
      className="w-full overflow-hidden rounded-2xl border border-border-strong bg-bg transition-colors duration-200 ease-standard focus-within:border-primary md:flex md:items-center md:gap-2 md:overflow-visible md:p-2"
    >
      <div className="flex min-h-15 flex-wrap items-center gap-2 py-1 pr-2 pl-4 md:order-2 md:min-h-12 md:flex-1 md:py-0 md:pr-0 md:pl-3">
        <label className="flex min-w-[min(100%,10rem)] flex-1 items-center gap-3">
          <span className="sr-only">{t('keyword')}</span>
          <Search
            aria-hidden="true"
            className="size-6 shrink-0 text-text-secondary"
            strokeWidth={2}
          />
          <input
            name="q"
            type="search"
            required
            defaultValue={keyword}
            enterKeyHint="search"
            autoComplete="off"
            placeholder={t('keywordPlaceholder')}
            className="min-h-12 w-full min-w-0 rounded-md bg-transparent text-field text-text-primary -outline-offset-2 placeholder:text-text-tertiary"
          />
        </label>
        <Button
          type="submit"
          size="icon"
          variant="primary"
          aria-label={t('submit')}
          className="ml-auto size-11 rounded-xl md:hidden"
        >
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8.5rem),1fr))] gap-px border-t border-hairline bg-hairline md:contents">
        <fieldset className="flex min-w-0 flex-col gap-1 bg-bg px-4 py-2.5 md:order-1 md:p-0">
          <legend className="sr-only">{t('target')}</legend>
          <span
            aria-hidden="true"
            className="text-caption text-text-tertiary md:hidden"
          >
            {t('target')}
          </span>
          <div className="flex w-fit max-w-full flex-wrap rounded-xl bg-surface-strong p-1">
            {(['item', 'hospital'] as const).map((value) => (
              <label key={value} className="touch-target cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={value}
                  defaultChecked={value === type}
                  className="peer sr-only"
                />
                <span className="flex min-h-10 items-center rounded-lg px-4 text-label text-text-secondary peer-checked:bg-bg peer-checked:text-label-bold peer-checked:text-primary-text peer-checked:shadow-card peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring">
                  {value === 'item' ? t('targetItem') : t('targetHospital')}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex min-w-0 flex-col bg-bg px-4 pt-2.5 pb-1 md:order-3 md:w-36 md:border-l md:border-hairline md:p-0 md:pl-4">
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
        size="lg"
        className="hidden md:order-4 md:inline-flex md:px-7"
      >
        {t('submit')}
      </Button>
    </form>
  );
}
