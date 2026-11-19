'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { Tag } from '@/components/ui/tag';
import { useFirstView } from '@/lib/motion/use-first-view';
import { cn } from '@/lib/utils';

import { aiDemoFrame, finalAiDemoFrame, typedSlice } from './ai-demo-timeline';

const CHIPS = ['manualTherapy', 'mri'] as const;

/**
 * AI 찾기 미리보기. 화면에 처음 들어올 때 한 번 질문이 쳐지고 답과 항목 칩이 나온다.
 * 움직이는 대화는 aria-hidden이고 같은 내용을 sr-only 문장으로 준다. 카드 전체가 /ai 링크다.
 */
export function AiPreview() {
  const t = useTranslations('home.aiPreview');
  const question = t('question');
  const questionLength = Array.from(question).length;
  const [ref, phase] = useFirstView<HTMLDivElement>({ playIfVisible: true });
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (phase !== 'playing') return;
    let frame = 0;
    let start: number | null = null;
    const step = (now: number) => {
      start ??= now;
      const next = now - start;
      setElapsed(next);
      if (!aiDemoFrame(next, questionLength, CHIPS.length).isDone) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [phase, questionLength]);

  const frame =
    phase === 'static'
      ? finalAiDemoFrame(questionLength, CHIPS.length)
      : aiDemoFrame(
          phase === 'waiting' ? 0 : elapsed,
          questionLength,
          CHIPS.length,
        );
  const isTyping = phase === 'playing' && frame.typedLength < questionLength;

  return (
    <section aria-labelledby="home-ai-preview">
      <PageContainer className="py-section">
        <div className="relative grid grid-cols-[minmax(0,1fr)] gap-8 rounded-3xl bg-surface p-5 transition-colors duration-200 ease-standard has-[a:hover]:bg-surface-strong md:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:p-12">
          <div className="flex flex-col items-start gap-3">
            <h2 id="home-ai-preview" className="text-section text-balance">
              {t('title')}
            </h2>
            <p className="text-body text-text-secondary">{t('description')}</p>
            <Link
              href="/ai"
              className="mt-3 inline-flex min-h-13 max-w-full items-center gap-2 rounded-xl bg-primary px-5 text-label-bold text-on-primary transition-colors duration-200 ease-standard outline-none after:absolute after:inset-0 after:rounded-3xl hover:bg-primary-hover focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus-ring active:bg-primary-pressed"
            >
              <Sparkles
                aria-hidden="true"
                className="size-5"
                strokeWidth={1.75}
              />
              {t('cta')}
              <ArrowRight
                aria-hidden="true"
                className="size-5"
                strokeWidth={1.75}
              />
            </Link>
          </div>

          <p className="sr-only">{t('srSummary', { question })}</p>
          <div
            ref={ref}
            aria-hidden="true"
            className="flex flex-col gap-3 rounded-2xl bg-bg p-4 [overflow-wrap:anywhere] md:p-6"
          >
            <Tag className="w-fit">{t('exampleTag')}</Tag>
            <div className="ml-4 grid self-end rounded-2xl rounded-br-md bg-primary px-4 py-3 text-body text-on-primary md:ml-8">
              <span className="col-start-1 row-start-1 opacity-0">
                {question}
              </span>
              <span className="col-start-1 row-start-1">
                {typedSlice(question, frame.typedLength)}
                {isTyping && (
                  <span className="ml-0.5 inline-block h-5 w-0.5 translate-y-1 bg-on-primary" />
                )}
              </span>
            </div>
            <div
              className={cn(
                'mr-4 ml-0 flex flex-col gap-3 self-start rounded-2xl rounded-bl-md bg-surface px-4 py-3 transition-[opacity,translate] duration-300 ease-enter md:mr-8',
                frame.isReplyVisible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-2 opacity-0',
              )}
            >
              <span className="text-body text-text-primary">{t('reply')}</span>
              <span className="flex flex-wrap gap-2">
                {CHIPS.map((chip, index) => (
                  <span
                    key={chip}
                    className={cn(
                      'inline-flex h-9 items-center rounded-full border border-primary bg-primary-tint px-4 text-label text-primary-text transition-[opacity,scale] duration-300 ease-enter',
                      index < frame.visibleChips
                        ? 'scale-100 opacity-100'
                        : 'scale-90 opacity-0',
                    )}
                  >
                    {t(`chips.${chip}`)}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
