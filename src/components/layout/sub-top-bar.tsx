import { ChevronLeft } from 'lucide-react';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { BackLink } from './back-link';

/** 모바일 하위 화면의 상단 바(뒤로 가기와 제목). 데스크톱에서는 TopNav가 대신하므로 숨는다. */
export function SubTopBar<T extends string>({
  title,
  backHref,
  actions,
}: {
  title: string;
  /** 이 화면으로 처음 들어왔을 때 돌아갈 곳. 앱 안에서 왔으면 온 곳으로 돌아간다. `/items/${code}` 같은 동적 경로도 받는다. */
  backHref: Route<T>;
  actions?: ReactNode;
}) {
  const t = useTranslations('common.actions');
  return (
    <header className="sticky top-0 z-(--z-header) border-b border-hairline bg-bg pt-safe lg:hidden">
      <div className="flex h-top-bar items-center gap-1 px-safe pr-2 pl-1">
        <BackLink
          fallbackHref={backHref}
          aria-label={t('back')}
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-text-primary active:bg-surface"
        >
          <ChevronLeft aria-hidden="true" className="size-6" strokeWidth={2} />
        </BackLink>
        <p className="min-w-0 flex-1 truncate text-subheading">{title}</p>
        {actions}
      </div>
    </header>
  );
}
