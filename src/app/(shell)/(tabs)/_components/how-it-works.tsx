'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { cn } from '@/lib/utils';

const STEPS = ['find', 'compare', 'decide'] as const;

/** 단계를 누르면 설명이 펼쳐진다. 오른쪽(모바일은 위) 그림은 검색 화면을 흉내 낸 장식이다. */
export function HowItWorks() {
  const t = useTranslations('home.howItWorks');
  const [active, setActive] = useState<(typeof STEPS)[number]>('find');

  return (
    <section aria-labelledby="home-how">
      <PageContainer className="grid gap-6 py-section lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-caption-bold text-primary-text">
              {t('eyebrow')}
            </p>
            <h2 id="home-how" className="text-section">
              {t('title')}
            </h2>
          </div>
          <ol className="space-y-4">
            {STEPS.map((step) => {
              const isActive = step === active;
              return (
                <li key={step} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'w-0.75 shrink-0 rounded-full transition-colors',
                      isActive ? 'bg-text-primary' : 'bg-border',
                    )}
                  />
                  <button
                    type="button"
                    aria-expanded={isActive}
                    onClick={() => setActive(step)}
                    className="flex min-h-11 flex-1 flex-col items-start gap-0.5 rounded-md text-left"
                  >
                    <span
                      className={cn(
                        'text-label-bold',
                        isActive ? 'text-text-primary' : 'text-text-tertiary',
                      )}
                    >
                      {t(`steps.${step}.title`)}
                    </span>
                    {isActive && (
                      <span className="text-body-sm text-text-secondary">
                        {t(`steps.${step}.description`)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div
          aria-hidden="true"
          className="order-first rounded-xl bg-surface p-4 lg:order-none lg:p-12"
        >
          <div className="mx-auto max-w-sm space-y-2 rounded-xl bg-bg p-4 shadow-card">
            <div className="flex h-11 items-center gap-2 rounded-lg border-[1.5px] border-primary px-3 text-label">
              <Search
                className="size-4.5 text-text-tertiary"
                strokeWidth={1.75}
              />
              {t('demo.query')}
              <span className="h-4.5 w-0.5 animate-pulse bg-primary" />
            </div>
            <ul className="space-y-0.5 rounded-lg p-1.5 shadow-card">
              {(['suggestion1', 'suggestion2', 'suggestion3'] as const).map(
                (key, index) => (
                  <li
                    key={key}
                    className={cn(
                      'flex h-9 items-center rounded-md px-2.5 text-body-sm',
                      index === 0 && 'bg-surface text-label',
                    )}
                  >
                    {t(`demo.${key}`)}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
