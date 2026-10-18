import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl space-y-6">
        <p className="text-sm font-semibold tracking-widest text-brand">
          MEDIPRICE
        </p>
        <h1 className="text-4xl font-bold tracking-tight">MediPrice</h1>
        <a
          className={cn(
            'inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 font-medium text-white',
            'hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand',
          )}
          href="https://nextjs.org/docs"
          target="_blank"
          rel="noreferrer"
        >
          Next.js 문서 <ArrowRight aria-hidden="true" size={18} />
        </a>
      </div>
    </main>
  );
}
