'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { type ReactNode, Suspense } from 'react';

import { HistoryTracker } from '@/components/layout/history-tracker';
import { getQueryClient } from '@/lib/query-client';

/** devDependency라서 개발 빌드에서만 불러온다. 운영 번들에서는 이 분기가 통째로 빠진다. */
const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? dynamic(
        () =>
          import('@tanstack/react-query-devtools').then(
            (module) => module.ReactQueryDevtools,
          ),
        { ssr: false },
      )
    : null;

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Suspense fallback={null}>
        <HistoryTracker />
      </Suspense>
      {ReactQueryDevtools && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
}
