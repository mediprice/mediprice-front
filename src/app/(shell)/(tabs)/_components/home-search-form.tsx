'use client';

import { ChevronDown, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { POPULAR_ITEMS } from '@/features/npay/catalog';
import { useRotation } from '@/lib/motion/use-rotation';

/** 자동으로 움직이는 내용은 5초 안에 끝나야 멈춤 버튼 없이도 된다(WCAG 2.2.2). 예시 3개 × 1.6초 = 4.8초. */
const EXAMPLES = POPULAR_ITEMS.slice(0, 3);
const EXAMPLE_INTERVAL_MS = 1600;

/**
 * JS 없이도 동작하는 GET 폼(/search가 type·q·region을 읽는다). 빈 입력창에는 인기 항목 3개가 예시로 한 바퀴(5초 안) 바뀌고 첫 예시에 멈춘다.
 * 예시는 aria-hidden 겹침 글자이고, 화면 낭독기는 고정된 placeholder를 읽는다. 마우스·포커스에 멈추고 reduced-motion이면 돌지 않는다.
 */
export function HomeSearchForm() {
  const t = useTranslations('home.search');
  const tItems = useTranslations('home.popular.items');
  const inputId = useId();
  const [type, setType] = useState<'item' | 'hospital'>('item');
  const rotation = useRotation(EXAMPLES.length, EXAMPLE_INTERVAL_MS, {
    once: true,
  });
  const example = EXAMPLES[rotation.index] ?? POPULAR_ITEMS[0];

  return (
    <form
      action="/search"
      role="search"
      aria-label={t('label')}
      className="flex w-full min-w-0 flex-col gap-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <fieldset className="min-w-0">
          <legend className="sr-only">{t('target')}</legend>
          <div className="flex flex-wrap gap-1">
            {(['item', 'hospital'] as const).map((value) => (
              <label key={value} className="min-w-0 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={value}
                  defaultChecked={value === 'item'}
                  onChange={() => setType(value)}
                  className="peer sr-only"
                />
                <span className="flex min-h-11 items-center rounded-full px-4 text-label text-text-secondary transition-colors duration-200 ease-standard peer-checked:bg-primary-tint peer-checked:text-label-bold peer-checked:text-primary-text peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring hover:text-text-primary">
                  {value === 'item' ? t('targetItem') : t('targetHospital')}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="relative flex min-h-11 items-center">
          <span className="sr-only">{t('region')}</span>
          <select
            name="region"
            defaultValue="metro"
            className="min-h-11 appearance-none rounded-full bg-transparent pr-8 pl-3 text-field text-text-primary hover:bg-surface"
          >
            <option value="metro">{t('regionAll')}</option>
            <option value="seoul">{t('regionSeoul')}</option>
            <option value="gyeonggi">{t('regionGyeonggi')}</option>
            <option value="all">{t('regionNationwide')}</option>
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-2 size-5 text-text-tertiary"
            strokeWidth={1.75}
          />
        </label>
      </div>

      <div
        {...rotation.rootProps}
        className="flex min-h-16 flex-wrap items-center justify-end gap-1 rounded-2xl border-2 border-primary bg-bg py-1.5 pr-1.5 pl-4 has-[input:focus]:outline-2 has-[input:focus]:outline-offset-2 has-[input:focus]:outline-focus-ring lg:min-h-18 lg:pl-5"
      >
        <Search
          aria-hidden="true"
          className="size-6 shrink-0 text-text-primary"
          strokeWidth={2}
        />
        <div className="relative flex min-h-12 min-w-24 flex-1 items-center self-stretch">
          <label htmlFor={inputId} className="sr-only">
            {t('keyword')}
          </label>
          <input
            id={inputId}
            name="q"
            type="search"
            required
            enterKeyHint="search"
            autoComplete="off"
            placeholder={t('keywordPlaceholder')}
            className="peer h-full min-h-11 w-full min-w-0 bg-transparent pl-2 text-field text-text-primary outline-none placeholder:text-transparent"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-2 flex max-w-[calc(100%-0.5rem)] items-center overflow-hidden text-field whitespace-nowrap text-text-tertiary opacity-0 peer-placeholder-shown:opacity-100"
          >
            {type === 'hospital' ? (
              t('hospitalExample')
            ) : (
              <span
                key={example.id}
                className="animate-in truncate duration-300 ease-standard fade-in slide-in-from-bottom-1"
              >
                {t('example', { name: tItems(`${example.id}.name`) })}
              </span>
            )}
          </span>
        </div>
        <Button type="submit" size="md" className="min-h-12 px-5 lg:px-7">
          {t('submit')}
        </Button>
      </div>
    </form>
  );
}
