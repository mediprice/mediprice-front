import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** 페이지 안 섹션 머리. 작은 꼬리말(eyebrow)·설명·오른쪽 행동은 선택이고, 모든 섹션이 같은 모양을 쓴다. */
export function SectionHeader({
  id,
  eyebrow,
  title,
  description,
  action,
  className,
  ...props
}: Omit<ComponentProps<'div'>, 'id' | 'title'> & {
  /** 루트가 아니라 제목(h2)에 붙는다. */
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      data-slot="section-header"
      className={cn('flex items-end justify-between gap-4', className)}
      {...props}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow && (
          <p className="text-caption-bold text-primary-text">{eyebrow}</p>
        )}
        <h2 id={id} className="text-section">
          {title}
        </h2>
        {description && (
          <p className="text-body-sm text-text-secondary">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
