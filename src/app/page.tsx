import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl space-y-6">
        <p className="text-caption-bold tracking-widest text-primary-text">
          MEDIPRICE
        </p>
        <h1 className="text-hero">MediPrice</h1>
        <a
          className={cn(
            'inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-label-bold text-on-primary shadow-cta-glow',
            'hover:bg-primary-hover active:bg-primary-pressed',
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
