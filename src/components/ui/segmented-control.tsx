import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

type Option<T extends string> = { value: T; label: string };

/** 몇 개 중 하나를 고르는 라디오 묶음(Figma "세그먼트"). 네이티브 radio라 화살표 키로 옮겨 다닌다. 묶음 이름은 aria-labelledby로 준다. */
export function SegmentedControl<T extends string>({
  name,
  value,
  options,
  onValueChange,
  className,
  ...props
}: Omit<ComponentProps<'div'>, 'onChange'> & {
  name: string;
  value: T;
  options: ReadonlyArray<Option<T>>;
  onValueChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      data-slot="segmented-control"
      className={cn('flex rounded-md bg-surface-strong p-1', className)}
      {...props}
    >
      {options.map((option) => (
        <label key={option.value} className="flex-1 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => onValueChange(option.value)}
            className="peer sr-only"
          />
          <span className="flex min-h-11 items-center justify-center rounded-md px-3 text-center text-label text-text-secondary transition-colors duration-150 ease-standard peer-checked:bg-bg peer-checked:text-label-bold peer-checked:text-primary-text peer-checked:shadow-card peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring hover:text-text-primary">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}
