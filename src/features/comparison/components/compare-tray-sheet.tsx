'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { type ReactNode, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogTrigger,
} from '@/components/ui/responsive-dialog';

import { MAX_COMPARE } from '../compare-params';
import { buildBasketHref, type CompareHospital } from '../compare-store';
import { CompareNumber } from './compare-number';

/** 비교함에 담은 병원을 하나씩 빼는 시트. 병원별 칩이 없는 모바일·큰 글자 비교함에서 연다. */
export function CompareTraySheet({
  hospitals,
  isOpen,
  onOpenChange,
  onRemove,
  children,
}: {
  hospitals: readonly CompareHospital[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRemove: (ykiho: string) => void;
  /** 시트를 여는 버튼. 닫으면 포커스가 여기로 돌아온다. */
  children: ReactNode;
}) {
  const t = useTranslations('comparison.tray');
  const statusRef = useRef<HTMLParagraphElement>(null);
  const canCompare = hospitals.length >= 2;

  function handleRemove(ykiho: string) {
    onRemove(ykiho);
    if (hospitals.length <= 1) {
      onOpenChange(false);
      return;
    }
    statusRef.current?.focus();
  }

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={onOpenChange}>
      <ResponsiveDialogTrigger asChild>{children}</ResponsiveDialogTrigger>
      <ResponsiveDialogContent
        title={t('sheetTitle')}
        footer={
          canCompare && (
            <Button asChild size="md" className="flex-1">
              <Link
                href={buildBasketHref(hospitals)}
                onClick={() => onOpenChange(false)}
              >
                {t('compare')}
              </Link>
            </Button>
          )
        }
      >
        <p
          ref={statusRef}
          tabIndex={-1}
          className="text-body-sm text-text-secondary outline-none"
        >
          {canCompare
            ? t('sheetCount', { count: hospitals.length, max: MAX_COMPARE })
            : t('needMore', { count: 2 - hospitals.length })}
        </p>
        <ul className="mt-2 flex flex-col">
          {hospitals.map((hospital, index) => (
            <li
              key={hospital.ykiho}
              className="flex min-h-14 items-center gap-3 border-b border-hairline py-2 last:border-b-0"
            >
              <CompareNumber value={index + 1} />
              <span className="min-w-0 flex-1 text-body break-keep text-text-primary">
                {hospital.name}
              </span>
              <Button
                variant="outline"
                size="md"
                aria-label={t('remove', { name: hospital.name })}
                onClick={() => handleRemove(hospital.ykiho)}
              >
                {t('removeShort')}
              </Button>
            </li>
          ))}
        </ul>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
