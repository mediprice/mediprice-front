'use client';

import { Scale } from 'lucide-react';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

import { measurePhase, type TemporaryMeasure } from '../review-moderation';
import { ObjectionDialog } from './objection-dialog';

/** 내 후기의 임시조치 안내. 기한, 신고 사유(신청인은 알리지 않음), 재게시 요청을 보여 준다. */
export function TemporaryMeasureNote({
  reviewId,
  measure,
  subject,
}: {
  reviewId: number;
  measure: TemporaryMeasure;
  /** 버튼 이름에 붙일 대상(병원 이름). 카드가 여러 개라 버튼 문구만으로는 어느 후기인지 알 수 없다. */
  subject: string;
}) {
  const t = useTranslations('claims.measure');
  const tObjection = useTranslations('claims.objection');
  const tReason = useTranslations('claims.form.reasons');
  const format = useFormatter();
  const now = useNow();
  const [isObjecting, setIsObjecting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const phase = measurePhase(measure, now);

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      className="flex flex-col gap-2 rounded-xl bg-warning-tint px-4 py-3 outline-none max-[22rem]:px-3"
    >
      <p className="flex items-start gap-2 text-label-bold text-warning">
        <Scale
          aria-hidden="true"
          className="mt-0.5 size-4.5 shrink-0"
          strokeWidth={1.75}
        />
        {phase.kind === 'hiddenUntil'
          ? t('hiddenUntil', {
              date: format.dateTime(phase.until, 'date'),
            })
          : t('reviewing')}
      </p>
      {measure.reasons.length > 0 && (
        <p className="text-body-sm text-text-primary">
          {t('reasons', {
            reasons: format.list(
              measure.reasons.map((reason) => tReason(reason)),
              { type: 'conjunction' },
            ),
          })}
        </p>
      )}
      <p className="text-body-sm text-text-secondary">{t('note')}</p>
      {measure.objectionAvailable ? (
        <Button
          ref={openerRef}
          variant="outline"
          size="sm"
          aria-label={tObjection('openFor', { name: subject })}
          onClick={() => setIsObjecting(true)}
          className="self-start"
        >
          {tObjection('open')}
        </Button>
      ) : (
        <p className="text-body-sm text-text-secondary">{t('objectionSent')}</p>
      )}
      <ObjectionDialog
        reviewId={reviewId}
        open={isObjecting}
        onOpenChange={setIsObjecting}
        onCloseAutoFocus={(event) => {
          /** 요청을 보내면 목록이 다시 받아져 연 버튼이 사라지므로 이 안내로 포커스를 옮긴다. */
          event.preventDefault();
          (openerRef.current ?? rootRef.current)?.focus();
        }}
      />
    </div>
  );
}
