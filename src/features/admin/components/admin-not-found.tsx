import { SearchX } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { BrandLink } from '@/components/layout/brand-link';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

/** 앱의 404 화면과 같은 문구·모양. 모바일은 셸에 위 바가 없어서 로고 머리를 직접 둔다. */
export function AdminNotFound() {
  const t = useTranslations('errors.page.notFound');
  return (
    <>
      <div className="flex h-top-bar items-center border-b border-hairline lg:hidden">
        <PageContainer>
          <BrandLink />
        </PageContainer>
      </div>
      <PageContainer className="flex flex-1 items-center justify-center py-section">
        <EmptyState
          titleAs="h1"
          icon={<SearchX />}
          title={t('title')}
          description={t('description')}
          action={
            <>
              <Button asChild variant="tint" size="md">
                <Link href="/">{t('home')}</Link>
              </Button>
              <Button asChild variant="ghost" size="md">
                <Link href="/search">{t('search')}</Link>
              </Button>
            </>
          }
        />
      </PageContainer>
    </>
  );
}
