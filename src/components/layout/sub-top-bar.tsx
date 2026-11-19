import { ChevronLeft } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

/** 모바일 하위 화면의 상단 바(뒤로 가기와 제목). 데스크톱에서는 TopNav가 대신하므로 숨는다. */
export function SubTopBar<T extends string>({
  title,
  backHref,
  actions,
}: {
  title: string;
  /** Link의 href처럼 `/items/${code}` 같은 동적 경로도 받는다. */
  backHref: Route<T>;
  actions?: ReactNode;
}) {
  const t = useTranslations('common.actions');
  return (
    <header className="sticky top-0 z-(--z-header) border-b border-hairline bg-bg pt-safe lg:hidden">
      <div className="flex h-top-bar items-center gap-1 px-safe pr-2 pl-1">
        <Link
          href={backHref}
          aria-label={t('back')}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-text-primary transition-colors duration-200 ease-standard active:bg-surface"
        >
          <ChevronLeft aria-hidden="true" className="size-6" strokeWidth={2} />
        </Link>
        <p className="min-w-0 flex-1 truncate text-subheading">{title}</p>
        {actions}
      </div>
    </header>
  );
}
