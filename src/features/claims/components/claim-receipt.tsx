'use client';

import { CircleCheck } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';

import type { ClaimReceipt as Receipt } from '../api';

/** 접수 결과. 양식이 사라지므로 제목으로 포커스를 옮겨 결과를 바로 읽게 한다. */
export function ClaimReceipt<T extends string>({
  receipt,
  email,
  backHref,
}: {
  receipt: Receipt;
  email: string;
  backHref: Route<T>;
}) {
  const t = useTranslations('claims.done');
  const format = useFormatter();
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => titleRef.current?.focus(), []);

  return (
    <section
      aria-labelledby="claim-receipt-title"
      className="flex flex-col gap-5 rounded-2xl bg-surface p-5 max-[22rem]:p-4 lg:p-6"
    >
      <div className="flex items-start gap-2">
        <CircleCheck
          aria-hidden="true"
          className="mt-1 size-6 shrink-0 text-positive"
          strokeWidth={1.75}
        />
        <h2
          ref={titleRef}
          id="claim-receipt-title"
          tabIndex={-1}
          className="text-heading outline-none"
        >
          {t('title')}
        </h2>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-subheading tabular-nums">
          {t('number', { id: receipt.id })}
        </p>
        <p className="text-body-sm text-text-secondary">{t('numberHint')}</p>
      </div>
      <ul className="list-disc space-y-1.5 pl-5 text-body marker:text-text-tertiary">
        <li className="pl-1">
          {t('hidden', {
            date: format.dateTime(new Date(receipt.temporaryUntil), 'date'),
          })}
        </li>
        <li className="pl-1">{t('reviewing')}</li>
        <li className="pl-1 wrap-anywhere">{t('email', { email })}</li>
      </ul>
      <Button asChild variant="tint" size="md" className="self-start">
        <Link href={backHref}>{t('back')}</Link>
      </Button>
    </section>
  );
}
