import { Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

/** 자해·자살 표현이면 대화를 멈추고 109 안내만 남긴다. 안내 문장은 AI 서버의 고정 문구(SELF_HARM_REPLY)가 말풍선에 있다. */
export function CrisisCard() {
  const t = useTranslations('ai.safety');
  return (
    <div className="flex flex-col gap-2">
      <Button asChild size="md" className="w-full">
        <a href="tel:109">
          <Phone aria-hidden="true" />
          {t('call109')}
        </a>
      </Button>
      <Button asChild variant="outline" size="md" className="w-full">
        <a href="tel:119">
          <Phone aria-hidden="true" />
          {t('call119')}
        </a>
      </Button>
      <p className="pt-1 text-body-sm text-text-secondary">{t('stopped')}</p>
    </div>
  );
}
