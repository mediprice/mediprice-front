'use client';

import { Check, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

/** 지금 비교 주소를 공유한다. 휴대폰은 기본 공유 창, 없으면 링크를 복사하고 복사했다고 알린다. */
export function CompareShare({ title }: { title: string }) {
  const t = useTranslations('comparison.share');
  const [isCopied, setIsCopied] = useState(false);

  async function share() {
    /** 뺀 병원 안내(dropped)는 받은 사람에게 의미가 없어 뺀다. */
    const link = new URL(window.location.href);
    link.searchParams.delete('dropped');
    const url = link.toString();
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2500);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => void share()}>
        {isCopied ? (
          <Check aria-hidden="true" />
        ) : (
          <Share2 aria-hidden="true" />
        )}
        {isCopied ? t('copied') : t('label')}
      </Button>
      <span role="status" className="sr-only">
        {isCopied ? t('copiedAnnounce') : ''}
      </span>
    </>
  );
}
