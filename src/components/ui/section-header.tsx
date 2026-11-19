import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** 페이지 안 섹션 머리. 제목은 결론을 먼저 말하는 문장으로 쓴다. 작은 꼬리말(eyebrow)·설명·오른쪽 행동은 선택이다. */
export function SectionHeader({
  id,
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div className="min-w-0 space-y-1.5">
        {eyebrow && (
          <p className="text-caption-bold text-primary-text">{eyebrow}</p>
        )}
        <h2 id={id} className="text-section text-balance">
          {title}
        </h2>
        {description && (
          <p className="text-body text-text-secondary">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
