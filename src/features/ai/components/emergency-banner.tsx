import { CircleAlert, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

/** 응급 표현이 한 번이라도 나오면 대화 위에 고정한다. 흐름은 멈추지 않는다. */
export function EmergencyBanner() {
  const t = useTranslations('ai.safety');
  return (
    <div
      role="alert"
      className="flex flex-col gap-2 rounded-lg bg-danger-tint px-4 py-3 lg:flex-row lg:items-center lg:gap-4"
    >
      <p className="flex flex-1 gap-2.5 text-body-sm text-text-primary">
        <CircleAlert
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-danger"
          strokeWidth={1.75}
        />
        <span>
          {t.rich('emergency', {
            b: (chunks) => <strong className="font-bold">{chunks}</strong>,
          })}
        </span>
      </p>
      <Button
        asChild
        variant="danger"
        size="sm"
        className="ml-7.5 w-fit lg:ml-0"
      >
        <a href="tel:119">
          <Phone aria-hidden="true" />
          {t('call119')}
        </a>
      </Button>
    </div>
  );
}
