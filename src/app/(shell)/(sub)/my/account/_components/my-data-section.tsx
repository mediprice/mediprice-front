'use client';

import { useMutation } from '@tanstack/react-query';
import { ChevronRight, Download, FileSearch } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { LEGAL_FACTS } from '@/config/legal';
import {
  isExportUnsupported,
  myDataFileName,
  saveJsonFile,
} from '@/features/auth/my-data-export';
import { exportMyData } from '@/features/auth/queries';
import { errorMessageKey } from '@/lib/api/error-message';

/** 개인정보 열람: 저장한 내 정보를 파일로 받고, 그 밖의 요구는 처리방침의 권리 행사 방법과 보호책임자로 안내한다. */
export function MyDataSection() {
  const t = useTranslations('mypage.account.data');
  const tErrors = useTranslations('errors');
  const [savedName, setSavedName] = useState<string | null>(null);
  const download = useMutation({
    mutationFn: exportMyData,
    onMutate: () => setSavedName(null),
    onSuccess: (data) => {
      const fileName = myDataFileName(new Date());
      saveJsonFile(data, fileName);
      setSavedName(fileName);
    },
  });
  const { privacyOfficer } = LEGAL_FACTS;
  const officerRows = [
    { label: t('officerName'), value: privacyOfficer.name },
    { label: t('officerEmail'), value: privacyOfficer.email },
    { label: t('officerPhone'), value: privacyOfficer.phone },
  ].filter((row): row is { label: string; value: string } =>
    Boolean(row.value),
  );

  return (
    <section
      aria-labelledby="account-data-title"
      className="flex flex-col gap-3"
    >
      <SectionHeader id="account-data-title" title={t('title')} />
      <div className="flex flex-col divide-y divide-hairline rounded-xl bg-bg px-4 shadow-card lg:px-5">
        <div className="flex flex-col gap-3 py-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <div className="flex min-w-0 flex-1 basis-60 items-start gap-3">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary max-[22rem]:hidden [&_svg]:size-5"
              >
                <Download strokeWidth={1.75} />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <h3 className="text-body break-keep">{t('exportTitle')}</h3>
                <p className="text-body-sm text-text-secondary">
                  {t('exportDescription')}
                </p>
              </div>
            </div>
            <Button
              variant="tint"
              size="md"
              isLoading={download.isPending}
              onClick={() => download.mutate()}
              className="w-full md:w-auto"
            >
              {t('exportAction')}
            </Button>
          </div>
          <div aria-live="polite" className="empty:hidden">
            {savedName && (
              <p className="text-body-sm text-positive">
                {t('exportDone', { fileName: savedName })}
              </p>
            )}
            {download.isError && (
              <p role="alert" className="text-body-sm text-danger">
                {isExportUnsupported(download.error)
                  ? t('exportUnsupported')
                  : tErrors(errorMessageKey(download.error))}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 py-3">
          <Link
            href="/privacy#rights"
            className="group flex min-h-16 items-center gap-3 rounded-lg py-1 active:bg-surface"
          >
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary max-[22rem]:hidden [&_svg]:size-5"
            >
              <FileSearch strokeWidth={1.75} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-body break-keep group-hover:underline">
                {t('requestTitle')}
              </span>
              <span className="text-body-sm text-text-secondary">
                {t('requestDescription')}
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="size-5 shrink-0 text-text-tertiary"
              strokeWidth={1.75}
            />
          </Link>
          {officerRows.length > 0 && (
            <dl
              aria-label={t('officerLabel')}
              className="mb-1 flex flex-col gap-1 rounded-lg bg-surface p-4 text-body-sm"
            >
              {officerRows.map((row) => (
                <div key={row.label} className="flex flex-wrap gap-x-3">
                  <dt className="text-text-secondary">{row.label}</dt>
                  <dd className="min-w-0 wrap-anywhere">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
