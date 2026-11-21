import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type TocEntry = { id: string; title: string };

const LINK =
  'flex min-h-11 items-center rounded-lg py-1.5 text-body-sm text-text-secondary hover:text-text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring';

function TocLinks({ entries }: { entries: TocEntry[] }) {
  return (
    <ol>
      {entries.map((entry) => (
        <li key={entry.id}>
          <a href={`#${entry.id}`} className={LINK}>
            {entry.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** 모바일은 접힌 목차(details, JS 없이 동작), 데스크톱은 왼쪽에 붙어 따라오는 목차다. */
export function LegalToc({
  entries,
  variant,
}: {
  entries: TocEntry[];
  variant: 'inline' | 'sidebar';
}) {
  const t = useTranslations('legal.document');
  if (variant === 'sidebar') {
    return (
      <nav
        aria-label={t('toc')}
        className="sticky top-[calc(var(--spacing-top-nav)+2rem)] hidden max-h-[calc(100dvh-var(--spacing-top-nav)-4rem)] overflow-y-auto pr-2 lg:block"
      >
        <p className="pb-2 text-label-bold text-text-primary">{t('toc')}</p>
        <TocLinks entries={entries} />
      </nav>
    );
  }
  return (
    <details className="group rounded-xl bg-surface lg:hidden">
      <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 text-subheading text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring [&::-webkit-details-marker]:hidden">
        {t('toc')}
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 text-text-secondary transition-transform duration-200 ease-standard group-open:rotate-180"
          strokeWidth={2}
        />
      </summary>
      <nav aria-label={t('toc')} className="px-4 pb-3">
        <TocLinks entries={entries} />
      </nav>
    </details>
  );
}
