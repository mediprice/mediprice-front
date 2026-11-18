'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ComponentProps, useId } from 'react';

import { SegmentedControl } from '@/components/ui/segmented-control';
import { institutionQueries } from '@/features/institutions/queries';
import { regionQueries } from '@/features/regions/queries';
import { cn } from '@/lib/utils';

import {
  type PriceFilters,
  REGIONS,
  sidoCodeOf,
  withRegion,
} from './price-filters';

/** 지역·시군구·종별 입력. 값은 부모가 쥔다(데스크톱 열은 바로 적용, 모바일 시트는 임시 선택). */
export function FilterPanel({
  value,
  onChange,
}: {
  value: PriceFilters;
  onChange: (next: PriceFilters) => void;
}) {
  const t = useTranslations('items');
  const id = useId();
  const sidoCode = sidoCodeOf(value.region);
  const sggu = useQuery({
    ...regionQueries.sggu(sidoCode ?? ''),
    enabled: sidoCode !== undefined,
    select: (list) =>
      list.toSorted((a, b) => a.name.localeCompare(b.name, 'ko')),
  });
  const institutionTypes = useQuery(institutionQueries.types());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p id={`${id}-region`} className="text-label-bold">
          {t('filters.region')}
        </p>
        <SegmentedControl
          aria-labelledby={`${id}-region`}
          name={`${id}-region`}
          value={value.region}
          options={REGIONS.map((region) => ({
            value: region,
            label: t(`filters.regionOptions.${region}`),
          }))}
          onValueChange={(region) => onChange(withRegion(value, region))}
        />
      </div>

      <FilterSelect
        label={t('filters.sggu')}
        hint={sidoCode ? undefined : t('filters.sgguNeedsRegion')}
        status={
          !sidoCode
            ? undefined
            : sggu.isPending
              ? t('filters.loading')
              : sggu.isError
                ? t('filters.loadError')
                : undefined
        }
        disabled={!sggu.data}
        value={value.sggu ?? ''}
        onChange={(event) =>
          onChange({ ...value, sggu: event.target.value || undefined })
        }
      >
        <option value="">{t('filters.sgguAll')}</option>
        {sggu.data?.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label={t('filters.institution')}
        status={
          institutionTypes.isPending
            ? t('filters.loading')
            : institutionTypes.isError
              ? t('filters.loadError')
              : undefined
        }
        disabled={!institutionTypes.data}
        value={value.institution ?? ''}
        onChange={(event) =>
          onChange({ ...value, institution: event.target.value || undefined })
        }
      >
        <option value="">{t('filters.institutionAll')}</option>
        {institutionTypes.data?.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </FilterSelect>
    </div>
  );
}

function FilterSelect({
  label,
  hint,
  status,
  className,
  ...props
}: ComponentProps<'select'> & {
  label: string;
  hint?: string;
  status?: string;
}) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, status && `${id}-status`]
    .filter(Boolean)
    .join(' ');
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-label-bold">
        {label}
      </label>
      <span className="relative flex items-center">
        <select
          id={id}
          aria-describedby={describedBy || undefined}
          className={cn(
            'min-h-12 w-full appearance-none rounded-lg border border-border-strong bg-bg pr-10 pl-4 text-field text-text-primary disabled:border-border disabled:bg-surface disabled:text-text-disabled',
            className,
          )}
          {...props}
        />
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 size-5 text-text-tertiary"
          strokeWidth={1.75}
        />
      </span>
      {hint && (
        <p id={`${id}-hint`} className="text-body-sm text-text-tertiary">
          {hint}
        </p>
      )}
      {status && (
        <p
          id={`${id}-status`}
          role="status"
          className="text-body-sm text-text-tertiary"
        >
          {status}
        </p>
      )}
    </div>
  );
}
