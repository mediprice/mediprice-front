import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

/** legal-facts.json에서 아직 null인 값 자리에 보인다. item을 주면 무엇이 빠졌는지 함께 쓴다. */
export function PendingFact({
  item,
  className,
}: {
  item?: string;
  className?: string;
}) {
  const t = useTranslations('legal.document');
  return (
    <span
      data-slot="pending-fact"
      className={cn(
        'inline-flex max-w-full items-start gap-1 rounded-md bg-warning-tint px-2 py-0.5 text-label-bold text-warning',
        !item && 'whitespace-nowrap',
        className,
      )}
    >
      <CircleAlert
        aria-hidden="true"
        className="mt-0.75 size-4 shrink-0"
        strokeWidth={2}
      />
      {item ? t('pendingItem', { item }) : t('pending')}
    </span>
  );
}
