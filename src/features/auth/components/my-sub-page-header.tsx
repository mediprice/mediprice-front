import { useTranslations } from 'next-intl';

import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
} from '@/components/layout/breadcrumb';
import { PageContainer } from '@/components/layout/page-container';
import { cn } from '@/lib/utils';

/**
 * 내 정보 하위 화면(관심·최근 기록·내 후기·의료 프로필·계정)의 머리. 모든 하위 화면이 같은 규칙을 따른다.
 * 데스크톱은 띠에 경로·제목·설명을 두고, 모바일은 상단 바(탭 화면은 띠)가 제목을 말하므로 설명만 둔다.
 * 탭 루트(관심)는 모바일 상단 바에 제목이 없어 띠와 제목을 그대로 보인다.
 */
export function MySubPageHeader({
  title,
  description,
  titleId,
  isTabRoot = false,
}: {
  title: string;
  description: string;
  /** 저장 뒤 포커스를 옮길 때처럼 제목을 가리켜야 하면 준다. */
  titleId?: string;
  isTabRoot?: boolean;
}) {
  const tNav = useTranslations('nav');
  return (
    <div className={cn('lg:bg-primary-tint', isTabRoot && 'bg-primary-tint')}>
      <PageContainer
        className={cn(
          'flex flex-col gap-2 md:max-w-2xl lg:max-w-page lg:py-10',
          isTabRoot ? 'py-6' : 'pt-4',
        )}
      >
        <Breadcrumb>
          <BreadcrumbLink href="/my">{tNav('my')}</BreadcrumbLink>
          <BreadcrumbCurrent>{title}</BreadcrumbCurrent>
        </Breadcrumb>
        <h1
          id={titleId}
          tabIndex={titleId ? -1 : undefined}
          className={cn(
            'text-title outline-none',
            !isTabRoot && 'sr-only lg:not-sr-only',
          )}
        >
          {title}
        </h1>
        <p className="text-body-sm text-text-secondary">{description}</p>
      </PageContainer>
    </div>
  );
}
