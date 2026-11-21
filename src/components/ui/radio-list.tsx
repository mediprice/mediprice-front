import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type RadioOption = { value: string; label: string; description?: string };

/** 세로로 늘어선 라디오 목록. 입력은 화면에서 숨기고 둥근 표시가 선택과 포커스를 보여 준다. inputProps에는 react-hook-form의 register 결과를 넘긴다. */
export function RadioList({
  legend,
  options,
  inputProps,
  error,
  errorId,
  className,
}: {
  legend: ReactNode;
  options: readonly RadioOption[];
  inputProps: Omit<ComponentProps<'input'>, 'type' | 'value'>;
  /** 번역한 오류 문구. */
  error?: string;
  errorId: string;
  className?: string;
}) {
  return (
    <fieldset
      data-slot="radio-list"
      aria-describedby={error ? errorId : undefined}
      className={cn('flex min-w-0 flex-col', className)}
    >
      <legend className="mb-1 text-label-bold">{legend}</legend>
      <div className="flex flex-col divide-y divide-hairline">
        {options.map((option) => (
          <label
            key={option.value}
            className="group flex min-h-12 cursor-pointer items-center gap-3 py-2 text-body"
          >
            <input
              type="radio"
              value={option.value}
              className="peer sr-only"
              {...inputProps}
            />
            <span
              aria-hidden="true"
              className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-border-strong transition-colors duration-150 ease-standard group-has-checked:border-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring"
            >
              <span className="size-2.5 scale-0 rounded-full bg-primary transition-transform duration-150 ease-standard group-has-checked:scale-100" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="group-has-checked:text-label-bold">
                {option.label}
              </span>
              {option.description && (
                <span className="text-body-sm text-text-secondary">
                  {option.description}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-body-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
